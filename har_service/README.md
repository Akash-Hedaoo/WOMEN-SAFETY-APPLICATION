# Safe-Era HAR service

This is the optional online Human Activity Recognition service used by the
mobile app as a backup to local `DeviceMotionEvent` detection. It accepts a
short six-axis IMU window (accelerometer and gyroscope), runs a local ONNX HAR
model, and returns an activity, confidence, abnormal flag, and safety score.
It never stores sensor windows.

## Model contract

Provide a trained six-axis ONNX HAR classifier through `HAR_MODEL_PATH`. The
default input adapter supports these common layouts:

- `[batch, time, 6]`
- `[batch, 6, time]`
- `[batch, time, 6, 1]`

The default class order is `standing,sitting,walking,running,fall,abnormal`.
Set `HAR_CLASS_LABELS` to the exact output-label order of your chosen model.
Use a model trained for smartphone IMU data; a model trained on a different
device placement or sampling rate must be calibrated before safety use.

An MIT-licensed CNN-LSTM reference trained on UCI HAR is available at
https://github.com/maroofiums/HAR-Activity-Recognition. Its six activity
classes and 50 Hz, 128-sample input should be reproduced/exported to ONNX
before using it here. Do not treat an uncalibrated HAR classifier as the sole
trigger for an emergency action.

## Run on Windows

Python is intentionally not bundled into this JavaScript project. Install
Python 3.10+ first, then run from this directory:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:HAR_MODEL_PATH = "C:\path\to\har_model.onnx"
$env:HAR_CLASS_LABELS = "standing,sitting,walking,running,fall,abnormal"
$env:HAR_SERVICE_SHARED_SECRET = "same-long-secret-as-backend-env"
uvicorn main:app --host 127.0.0.1 --port 8000
```

Then set the same `HAR_SERVICE_SHARED_SECRET` and
`HAR_SERVICE_URL=http://127.0.0.1:8000` in `backend/.env`, and restart the
Node backend. If this service or its model is unavailable, the app receives an
unavailable result and continues local motion monitoring.
