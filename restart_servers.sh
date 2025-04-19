echo "Stopping running servers..."
pkill -f "npm run dev"
pkill -f "uvicorn app.main:app"

echo "Starting backend server..."
cd ~/repos/ppsr/backend
poetry run uvicorn app.main:app --reload &

echo "Starting frontend server..."
cd ~/repos/ppsr/frontend
npm run dev &

echo "Servers restarted successfully!"
echo "Frontend: http://localhost:5173/"
echo "Backend: http://localhost:8000/"
