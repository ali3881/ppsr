"""
PDF Generator for PPSR Vehicle Search Results
"""
import os
import tempfile
from datetime import datetime
from io import BytesIO
from typing import Dict, Any, Optional, Union

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    Image, PageBreak, Frame, PageTemplate, BaseDocTemplate
)
from reportlab.platypus.flowables import HRFlowable

class PPSRDocTemplate(BaseDocTemplate):
    """Custom document template for PPSR reports with headers and footers"""
    
    def __init__(self, filename, **kwargs):
        self.page_info = kwargs.pop('page_info', {})
        super().__init__(filename, **kwargs)
        self.page_count = 0
        
        frame = Frame(
            self.leftMargin, 
            self.bottomMargin, 
            self.width, 
            self.height - 2.5*cm,
            id='normal'
        )
        
        template = PageTemplate(
            id='default',
            frames=[frame],
            onPage=self.add_page_elements
        )
        
        self.addPageTemplates(template)
    
    def add_page_elements(self, canvas, doc):
        """Add header and footer to each page"""
        self.page_count += 1
        canvas.saveState()
        
        canvas.setFont('Helvetica-Bold', 10)
        canvas.setFillColor(colors.grey)
        canvas.drawString(2*cm, 2*cm, "Environment: Discovery")
        
        canvas.setFont('Helvetica-Bold', 10)
        canvas.setFillColor(colors.grey)
        canvas.drawString(2*cm, A4[1] - 2*cm, self.page_info.get('date', ''))
        
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.grey)
        canvas.drawString(2*cm, 1.5*cm, "Environment: Discovery")
        canvas.drawRightString(
            A4[0] - 2*cm, 
            1.5*cm, 
            f"Page {self.page_count} of {self.page_info.get('total_pages', '?')}"
        )
        
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.grey)
        timestamp = self.page_info.get('timestamp', '')
        if timestamp:
            canvas.drawString(
                2*cm, 
                A4[1] - 4.5*cm, 
                f"This search certificate reflects the data contained in the PPSR at {timestamp} (Canberra Time)."
            )
        
        canvas.restoreState()


def generate_vehicle_search_pdf(
    search_data: Dict[str, Any],
    output_path: Optional[str] = None
) -> Union[str, BytesIO]:
    """
    Generate a PDF report for a vehicle search result.
    
    Args:
        search_data: Dictionary containing search results and metadata
        output_path: Optional path to save the PDF file
        
    Returns:
        Path to the generated PDF file or BytesIO object
    """
    if not output_path:
        buffer = BytesIO()
        output = buffer
    else:
        output = output_path
    
    now = datetime.now()
    date_str = now.strftime("%d/%m/%Y")
    timestamp_str = now.strftime("%d/%m/%Y %H:%M:%S")
    
    doc = PPSRDocTemplate(
        output,
        pagesize=A4,
        leftMargin=2*cm,
        rightMargin=2*cm,
        topMargin=2.5*cm,
        bottomMargin=2.5*cm,
        page_info={
            'date': date_str,
            'timestamp': timestamp_str,
            'total_pages': 3  # Estimate, will be updated
        }
    )
    
    styles = getSampleStyleSheet()
    
    custom_styles = {
        'PPSRTitle': ParagraphStyle(
            name='PPSRTitle',
            parent=styles['Heading1'],
            fontSize=14,
            alignment=1,  # Center
            spaceAfter=6
        ),
        'PPSRSubtitle': ParagraphStyle(
            name='PPSRSubtitle',
            parent=styles['Heading2'],
            fontSize=12,
            alignment=1,  # Center
            spaceAfter=12
        ),
        'SectionHeading': ParagraphStyle(
            name='SectionHeading',
            parent=styles['Heading2'],
            fontSize=12,
            spaceAfter=6
        ),
        'PPSRNormal': ParagraphStyle(
            name='PPSRNormal',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=6
        ),
        'Small': ParagraphStyle(
            name='Small',
            parent=styles['Normal'],
            fontSize=8,
            spaceAfter=3
        )
    }
    
    for style_name, style in custom_styles.items():
        if style_name not in styles:
            styles.add(style)
    
    elements = []
    
    elements.append(Paragraph("PPSR Vehicle Search Certificate", styles['PPSRTitle']))
    elements.append(Spacer(1, 3*mm))
    
    search_type = search_data.get('search_type', 'VIN')
    elements.append(
        Paragraph(
            f"This is a PPSR search certificate for a {search_type} search",
            styles['PPSRSubtitle']
        )
    )
    elements.append(Spacer(1, 5*mm))
    
    cert_number = search_data.get('certificate_number', f"{int(now.timestamp())}")
    search_number = search_data.get('search_number', f"{int(now.timestamp()/100)}")
    
    cert_data = [
        ["Search certificate number:", cert_number],
        ["Search number:", search_number]
    ]
    
    cert_table = Table(
        cert_data,
        colWidths=[5*cm, 10*cm],
        style=TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ])
    )
    elements.append(cert_table)
    elements.append(Spacer(1, 5*mm))
    
    elements.append(
        Paragraph(
            "This Search certificate is provided under section 174 of the Personal Property Securities Act 2009",
            styles['PPSRNormal']
        )
    )
    elements.append(Spacer(1, 10*mm))
    
    elements.append(Paragraph("Search Criteria Details", styles['SectionHeading']))
    elements.append(Spacer(1, 2*mm))
    
    search_criteria = [
        ["Search type:", search_data.get('search_type', 'VIN')],
        ["Identifier:", search_data.get('identifier', '')],
    ]
    
    if search_data.get('search_type') == 'Registration':
        search_criteria.append(["State:", search_data.get('state', '')])
    
    search_criteria.append(["Search date:", timestamp_str])
    
    criteria_table = Table(
        search_criteria,
        colWidths=[5*cm, 10*cm],
        style=TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ])
    )
    elements.append(criteria_table)
    elements.append(Spacer(1, 10*mm))
    
    elements.append(Paragraph("Search Results", styles['SectionHeading']))
    elements.append(Spacer(1, 2*mm))
    
    if not search_data.get('search_results'):
        elements.append(
            Paragraph(
                "No matching records were found for this vehicle identifier.",
                styles['PPSRNormal']
            )
        )
    else:
        elements.append(Paragraph("Vehicle Status", styles['SectionHeading']))
        elements.append(Spacer(1, 2*mm))
        
        status_data = []
        
        written_off = search_data.get('written_off', False)
        written_off_status = "Yes" if written_off else "No"
        status_data.append(["Written-off status:", written_off_status])
        
        stolen = search_data.get('stolen', False)
        stolen_status = "Yes" if stolen else "No"
        status_data.append(["Stolen status:", stolen_status])
        
        status_table = Table(
            status_data,
            colWidths=[5*cm, 10*cm],
            style=TableStyle([
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BACKGROUND', (1, 0), (1, 0), colors.pink if written_off else colors.white),
                ('BACKGROUND', (1, 1), (1, 1), colors.pink if stolen else colors.white),
            ])
        )
        elements.append(status_table)
        elements.append(Spacer(1, 5*mm))
        
        elements.append(Paragraph("Vehicle Details", styles['SectionHeading']))
        elements.append(Spacer(1, 2*mm))
        
        vehicle_details = search_data.get('search_results', {})
        vehicle_data = []
        
        for key, value in vehicle_details.items():
            if key not in ['written_off', 'stolen']:
                vehicle_data.append([key.replace('_', ' ').title() + ":", str(value)])
        
        if vehicle_data:
            vehicle_table = Table(
                vehicle_data,
                colWidths=[5*cm, 10*cm],
                style=TableStyle([
                    ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                    ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ])
            )
            elements.append(vehicle_table)
    
    elements.append(PageBreak())
    
    elements.append(Paragraph("How to verify this certificate on the PPSR", styles['SectionHeading']))
    elements.append(Spacer(1, 2*mm))
    elements.append(
        Paragraph(
            "You can use the search number from an original search (as shown on this certificate) "
            "to retrieve the original search results and to issue a copy of the search certificate "
            "at https://transact.ppsr.gov.au/ppsr/Home.",
            styles['PPSRNormal']
        )
    )
    elements.append(
        Paragraph(
            "There is no fee, however this process will not provide any update to the information in the original search.",
            styles['PPSRNormal']
        )
    )
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("Privacy and Terms and Conditions", styles['SectionHeading']))
    elements.append(Spacer(1, 2*mm))
    elements.append(
        Paragraph(
            "The Australian Financial Security Authority is subject to the Privacy Act 1988 which requires "
            "that we comply with the Australian Privacy Principles (APPs) set out in the Act. The APPs set "
            "out how Australian Government agencies should collect, use, store and disclose personal information "
            "and how individuals can access records containing their personal information.",
            styles['PPSRNormal']
        )
    )
    elements.append(
        Paragraph(
            "Access to and use of the PPSR is subject to the General Conditions of Use, as well as other "
            "relevant terms and conditions. All relevant terms and conditions can be found at www.ppsr.gov.au.",
            styles['PPSRNormal']
        )
    )
    
    elements.append(PageBreak())
    
    elements.append(Paragraph("End of search certificate", styles['PPSRNormal']))
    elements.append(Spacer(1, 5*mm))
    
    contact_data = [
        ["EMAIL: enquiries@ppsr.gov.au", "WEBSITE: www.ppsr.gov.au"],
        ["", "1300 00 77 77"],
        ["GPO Box 1944 Adelaide SA 5001", ""]
    ]
    
    contact_table = Table(
        contact_data,
        colWidths=[8*cm, 7*cm],
        style=TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ])
    )
    elements.append(contact_table)
    
    doc.page_info['total_pages'] = 3
    
    doc.build(elements)
    
    if not output_path:
        buffer.seek(0)
        return buffer
    
    return output_path


def generate_temp_pdf_path(identifier: str) -> str:
    """Generate a temporary file path for a PDF"""
    temp_dir = tempfile.gettempdir()
    filename = f"ppsr_vehicle_search_{identifier}_{int(datetime.now().timestamp())}.pdf"
    return os.path.join(temp_dir, filename)
