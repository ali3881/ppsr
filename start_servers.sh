
echo "Starting PHP backend server on http://localhost:8000..."
cd ~/repos/ppsr/php-backend
php artisan serve --port=8000 &
PHP_PID=$!

echo "Starting frontend server on http://localhost:5173..."
cd ~/repos/ppsr/frontend
npm run dev &
FRONTEND_PID=$!

echo "Press Ctrl+C to stop both servers"
wait
