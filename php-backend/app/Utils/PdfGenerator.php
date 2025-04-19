<?php

namespace App\Utils;

use TCPDF;
use Carbon\Carbon;
use Illuminate\Support\Str;

class PdfGenerator
{
    public function generateVehicleSearchPdf($search_data, $output_path = null)
    {
        $pdf = new class extends TCPDF {
            public $page_info = [];
            
            public function Header()
            {
                $this->SetFont('helvetica', 'B', 10);
                $this->SetTextColor(128, 128, 128);
                $this->Cell(0, 10, 'Environment: Discovery', 0, false, 'L');
                
                if (isset($this->page_info['date'])) {
                    $this->SetXY(20, 10);
                    $this->Cell(0, 10, $this->page_info['date'], 0, false, 'L');
                }
                
                if (isset($this->page_info['timestamp'])) {
                    $this->SetFont('helvetica', '', 8);
                    $this->SetXY(20, 40);
                    $this->Cell(0, 10, 'This search certificate reflects the data contained in the PPSR at '.$this->page_info['timestamp'].' (Canberra Time).', 0, false, 'L');
                }
            }
            
            public function Footer()
            {
                $this->SetY(-15);
                $this->SetFont('helvetica', '', 8);
                $this->SetTextColor(128, 128, 128);
                $this->Cell(0, 10, 'Environment: Discovery', 0, false, 'L');
                $this->Cell(0, 10, 'Page '.$this->getAliasNumPage().' of '.$this->getAliasNbPages(), 0, false, 'R');
            }
        };
        
        $pdf->SetCreator('PPSR Application');
        $pdf->SetTitle('PPSR Vehicle Search Certificate');
        $pdf->SetAuthor('PPSR Application');
        $pdf->SetMargins(20, 25, 20);
        $pdf->SetHeaderMargin(10);
        $pdf->SetFooterMargin(15);
        $pdf->SetAutoPageBreak(true, 20);
        
        $now = Carbon::now();
        $date_str = $now->format('d/m/Y');
        $timestamp_str = $now->format('d/m/Y H:i:s');
        
        $pdf->page_info = [
            'date' => $date_str,
            'timestamp' => $timestamp_str,
            'total_pages' => 3
        ];
        
        $pdf->AddPage();
        
        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->Cell(0, 10, 'PPSR Vehicle Search Certificate', 0, 1, 'C');
        $pdf->Ln(3);
        
        $search_type = $search_data['search_type'] ?? 'VIN';
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, "This is a PPSR search certificate for a {$search_type} search", 0, 1, 'C');
        $pdf->Ln(5);
        
        $cert_number = $search_data['certificate_number'] ?? (string)$now->timestamp;
        $search_number = $search_data['search_number'] ?? (string)($now->timestamp/100);
        
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(50, 10, 'Search certificate number:', 0);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(100, 10, $cert_number, 0, 1);
        
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(50, 10, 'Search number:', 0);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(100, 10, $search_number, 0, 1);
        $pdf->Ln(5);
        
        $pdf->SetFont('helvetica', '', 10);
        $pdf->MultiCell(0, 10, 'This Search certificate is provided under section 174 of the Personal Property Securities Act 2009', 0, 'L');
        $pdf->Ln(10);
        
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, 'Search Criteria', 0, 1, 'L');
        $pdf->SetDrawColor(200, 200, 200);
        $pdf->Line(20, $pdf->GetY(), 190, $pdf->GetY());
        $pdf->Ln(5);
        
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(50, 10, 'Search type:', 0);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(100, 10, $search_data['search_type'], 0, 1);
        
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(50, 10, 'Search criteria:', 0);
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Cell(100, 10, $search_data['identifier'], 0, 1);
        
        if (isset($search_data['state']) && $search_data['state']) {
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(50, 10, 'State:', 0);
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(100, 10, $search_data['state'], 0, 1);
        }
        
        $pdf->Ln(10);
        
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, 'Search Results', 0, 1, 'L');
        $pdf->SetDrawColor(200, 200, 200);
        $pdf->Line(20, $pdf->GetY(), 190, $pdf->GetY());
        $pdf->Ln(5);
        
        if (isset($search_data['search_results']) && $search_data['search_results']) {
            $results = $search_data['search_results'];
            
            if (isset($results['make'])) {
                $pdf->SetFont('helvetica', 'B', 10);
                $pdf->Cell(50, 10, 'Make:', 0);
                $pdf->SetFont('helvetica', '', 10);
                $pdf->Cell(100, 10, $results['make'], 0, 1);
            }
            
            if (isset($results['model'])) {
                $pdf->SetFont('helvetica', 'B', 10);
                $pdf->Cell(50, 10, 'Model:', 0);
                $pdf->SetFont('helvetica', '', 10);
                $pdf->Cell(100, 10, $results['model'], 0, 1);
            }
            
            if (isset($results['year'])) {
                $pdf->SetFont('helvetica', 'B', 10);
                $pdf->Cell(50, 10, 'Year:', 0);
                $pdf->SetFont('helvetica', '', 10);
                $pdf->Cell(100, 10, $results['year'], 0, 1);
            }
            
            if (isset($results['color'])) {
                $pdf->SetFont('helvetica', 'B', 10);
                $pdf->Cell(50, 10, 'Color:', 0);
                $pdf->SetFont('helvetica', '', 10);
                $pdf->Cell(100, 10, $results['color'], 0, 1);
            }
            
            if (isset($results['engine_number'])) {
                $pdf->SetFont('helvetica', 'B', 10);
                $pdf->Cell(50, 10, 'Engine number:', 0);
                $pdf->SetFont('helvetica', '', 10);
                $pdf->Cell(100, 10, $results['engine_number'], 0, 1);
            }
            
            if (isset($results['registration'])) {
                $pdf->SetFont('helvetica', 'B', 10);
                $pdf->Cell(50, 10, 'Registration:', 0);
                $pdf->SetFont('helvetica', '', 10);
                $pdf->Cell(100, 10, $results['registration'], 0, 1);
            }
            
            $pdf->Ln(5);
            
            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->Cell(0, 10, 'Vehicle Status', 0, 1, 'L');
            $pdf->SetDrawColor(200, 200, 200);
            $pdf->Line(20, $pdf->GetY(), 190, $pdf->GetY());
            $pdf->Ln(5);
            
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(50, 10, 'Written-off:', 0);
            $pdf->SetFont('helvetica', '', 10);
            $written_off = isset($search_data['written_off']) && $search_data['written_off'] ? 'Yes' : 'No';
            $pdf->Cell(100, 10, $written_off, 0, 1);
            
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(50, 10, 'Stolen:', 0);
            $pdf->SetFont('helvetica', '', 10);
            $stolen = isset($search_data['stolen']) && $search_data['stolen'] ? 'Yes' : 'No';
            $pdf->Cell(100, 10, $stolen, 0, 1);
            
            if (isset($results['encumbered'])) {
                $pdf->Ln(5);
                $pdf->SetFont('helvetica', 'B', 12);
                $pdf->Cell(0, 10, 'Encumbrance Information', 0, 1, 'L');
                $pdf->SetDrawColor(200, 200, 200);
                $pdf->Line(20, $pdf->GetY(), 190, $pdf->GetY());
                $pdf->Ln(5);
                
                $pdf->SetFont('helvetica', 'B', 10);
                $pdf->Cell(50, 10, 'Encumbered:', 0);
                $pdf->SetFont('helvetica', '', 10);
                $encumbered = $results['encumbered'] ? 'Yes' : 'No';
                $pdf->Cell(100, 10, $encumbered, 0, 1);
                
                if ($results['encumbered'] && isset($results['encumbrance_details'])) {
                    $pdf->Ln(5);
                    $pdf->SetFont('helvetica', 'B', 10);
                    $pdf->Cell(0, 10, 'Encumbrance Details:', 0, 1);
                    
                    foreach ($results['encumbrance_details'] as $detail) {
                        $pdf->SetFont('helvetica', 'B', 9);
                        $pdf->Cell(50, 8, 'Registration number:', 0);
                        $pdf->SetFont('helvetica', '', 9);
                        $pdf->Cell(100, 8, $detail['registration_number'] ?? 'N/A', 0, 1);
                        
                        $pdf->SetFont('helvetica', 'B', 9);
                        $pdf->Cell(50, 8, 'Registration date:', 0);
                        $pdf->SetFont('helvetica', '', 9);
                        $pdf->Cell(100, 8, $detail['registration_date'] ?? 'N/A', 0, 1);
                        
                        $pdf->SetFont('helvetica', 'B', 9);
                        $pdf->Cell(50, 8, 'Secured party:', 0);
                        $pdf->SetFont('helvetica', '', 9);
                        $pdf->Cell(100, 8, $detail['secured_party'] ?? 'N/A', 0, 1);
                        
                        $pdf->SetFont('helvetica', 'B', 9);
                        $pdf->Cell(50, 8, 'Address:', 0);
                        $pdf->SetFont('helvetica', '', 9);
                        $pdf->Cell(100, 8, $detail['address'] ?? 'N/A', 0, 1);
                        
                        $pdf->Ln(3);
                    }
                }
            }
        } else {
            $pdf->SetFont('helvetica', '', 10);
            $pdf->Cell(0, 10, 'No vehicle records found for the provided search criteria.', 0, 1);
        }
        
        $pdf->AddPage();
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, 'Disclaimer', 0, 1, 'L');
        $pdf->SetDrawColor(200, 200, 200);
        $pdf->Line(20, $pdf->GetY(), 190, $pdf->GetY());
        $pdf->Ln(5);
        
        $pdf->SetFont('helvetica', '', 10);
        $disclaimer = "This search certificate reflects the data contained in the PPSR at the time of the search. It is not real data and is provided for testing purposes only.\n\n";
        $disclaimer .= "The PPSR does not warrant the accuracy, completeness or currency of any information provided through searches of the PPSR.\n\n";
        $disclaimer .= "To the extent permitted by law, the Commonwealth of Australia will not be liable for any loss or damage suffered by any person as a result of their reliance on information provided through a search of the PPSR.";
        
        $pdf->MultiCell(0, 10, $disclaimer, 0, 'L');
        
        if ($output_path) {
            $pdf->Output($output_path, 'F');
            return $output_path;
        } else {
            return $pdf->Output('', 'S');
        }
    }
    
    public function generateTempPdfPath($identifier)
    {
        $temp_dir = sys_get_temp_dir();
        $filename = "ppsr_vehicle_search_{$identifier}_" . time() . ".pdf";
        return $temp_dir . DIRECTORY_SEPARATOR . $filename;
    }
}
