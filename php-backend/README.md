# PPSR PHP Backend

This is a PHP implementation of the PPSR B2G client backend. It replaces the previous Python implementation.

## Dependencies

- PHP 8.1 or higher
- Composer
- Laravel 9.x
- Stripe PHP SDK
- TCPDF
- PHP SoapClient extension
- PHP XML extension
- PHP cURL extension

## Setup

1. Install dependencies:
```bash
composer install
```

2. Set up environment variables:
```bash
cp .env.example .env
php artisan key:generate
```

3. Configure the environment variables in `.env` file with your PPSR B2G credentials and Stripe API keys.

4. Start the server:
```bash
php artisan serve --port=8000
```

## API Endpoints

- `GET /api/healthz`: Health check endpoint
- `POST /api/ppsr/change-password`: Change B2G password
- `GET /api/ppsr/status`: Get PPSR B2G connection status
- `POST /api/ppsr/search/vehicle`: Search for vehicle by VIN, Chassis, or Registration
- `POST /api/ppsr/payment/create-intent`: Create Stripe payment intent
- `POST /api/ppsr/payment/confirm`: Confirm Stripe payment
- `POST /api/ppsr/search/vehicle/pdf`: Generate PDF report for vehicle search

## API Request Examples

### Change Password
```json
POST /api/ppsr/change-password
{
  "account_number": "130040219",
  "username": "pps959",
  "current_password": "7V9RDKXHMWCR",
  "new_password": "NewPassword123"
}
```

### Vehicle Search
```json
POST /api/ppsr/search/vehicle
{
  "search_type": "VIN",
  "identifier": "WBAAL31090FW12345"
}
```

### Create Payment Intent
```json
POST /api/ppsr/payment/create-intent
{
  "search_id": "WBAAL31090FW12345",
  "search_type": "VIN"
}
```

## Testing

Run the tests with:
```bash
php artisan test
```

## Mock Service

For testing purposes, the application includes a mock service that simulates PPSR B2G operations. This can be enabled by setting `USE_MOCK_SERVICE=true` in the `.env` file.

The mock service includes test data for vehicle searches with the following identifiers:

### VIN Numbers
- WBAAL31090FW12345 (BMW 318i, encumbered)
- JN1TANT31U0123456 (Nissan X-Trail, written-off)
- WAUZZZ8K9DA123456 (Audi A4, stolen)

### Registration Numbers
- NSW_ABC123 (BMW 318i)
- VIC_XYZ789 (Nissan X-Trail)
- QLD_DEF456 (Audi A4)
