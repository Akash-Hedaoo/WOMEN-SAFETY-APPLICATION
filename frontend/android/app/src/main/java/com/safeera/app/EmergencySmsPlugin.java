package com.safeera.app;

import android.Manifest;
import android.app.Activity;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Handler;
import android.os.Looper;
import android.telephony.SmsManager;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Sends an SOS through the active device SIM/eSIM. This does not require an
 * internet connection, but Android requires the user to grant SEND_SMS.
 */
@CapacitorPlugin(
    name = "EmergencySms",
    permissions = {
        @Permission(alias = "sms", strings = { Manifest.permission.SEND_SMS })
    }
)
public class EmergencySmsPlugin extends Plugin {
    private static final String SMS_SENT_ACTION = "com.safeera.app.SMS_SENT";
    private static final long SMS_RESULT_TIMEOUT_MS = 20_000L;
    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", hasSmsCapability());
        result.put("permissionGranted", getPermissionState("sms") == PermissionState.GRANTED);
        call.resolve(result);
    }

    @PluginMethod
    public void send(PluginCall call) {
        if (!hasSmsCapability()) {
            call.reject("This device cannot send SMS");
            return;
        }

        if (getPermissionState("sms") != PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "sendAfterPermission");
            return;
        }

        sendMessage(call);
    }

    @PermissionCallback
    private void sendAfterPermission(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            call.reject("SMS permission was not granted");
            return;
        }
        sendMessage(call);
    }

    private void sendMessage(PluginCall call) {
        String phoneNumber = call.getString("phoneNumber", "").trim();
        String message = call.getString("message", "");

        if (phoneNumber.isEmpty() || message.isEmpty()) {
            call.reject("A recipient and emergency message are required");
            return;
        }

        try {
            sendAndConfirm(call, phoneNumber, message);
        } catch (Exception error) {
            call.reject("Unable to send emergency SMS: " + error.getMessage(), error);
        }
    }

    /**
     * SmsManager only queues an SMS.  Waiting for ACTION_SENT prevents the UI
     * from marking a message as sent when Android rejects it (no SIM, no
     * service, radio off, or a carrier error).
     */
    private void sendAndConfirm(PluginCall call, String phoneNumber, String message) {
        SmsManager smsManager = SmsManager.getDefault();
        ArrayList<String> parts = smsManager.divideMessage(message);
        Context context = getContext();
        Handler handler = new Handler(Looper.getMainLooper());
        AtomicBoolean completed = new AtomicBoolean(false);
        final int[] remainingParts = { parts.size() };
        final int[] failedResultCode = { Activity.RESULT_OK };

        call.setKeepAlive(true);

        BroadcastReceiver sentReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context receiverContext, Intent intent) {
                if (!SMS_SENT_ACTION.equals(intent.getAction()) || completed.get()) return;

                if (getResultCode() != Activity.RESULT_OK && failedResultCode[0] == Activity.RESULT_OK) {
                    failedResultCode[0] = getResultCode();
                }

                remainingParts[0]--;
                if (remainingParts[0] == 0) {
                    finishSmsResult(call, context, this, handler, completed, failedResultCode[0], parts.size());
                }
            }
        };

        ContextCompat.registerReceiver(
            context,
            sentReceiver,
            new IntentFilter(SMS_SENT_ACTION),
            ContextCompat.RECEIVER_NOT_EXPORTED
        );

        handler.postDelayed(() -> {
            if (completed.compareAndSet(false, true)) {
                safelyUnregisterReceiver(context, sentReceiver);
                call.reject("Timed out waiting for the device to confirm SMS sending");
            }
        }, SMS_RESULT_TIMEOUT_MS);

        try {
            ArrayList<PendingIntent> sentIntents = new ArrayList<>();
            int baseRequestCode = (int) (System.currentTimeMillis() & 0x0fffffff);
            for (int i = 0; i < parts.size(); i++) {
                Intent sentIntent = new Intent(SMS_SENT_ACTION).setPackage(context.getPackageName());
                sentIntents.add(PendingIntent.getBroadcast(
                    context,
                    baseRequestCode + i,
                    sentIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                ));
            }

            if (parts.size() > 1) {
                smsManager.sendMultipartTextMessage(phoneNumber, null, parts, sentIntents, null);
            } else {
                smsManager.sendTextMessage(phoneNumber, null, message, sentIntents.get(0), null);
            }
        } catch (Exception error) {
            if (completed.compareAndSet(false, true)) {
                safelyUnregisterReceiver(context, sentReceiver);
                call.reject("Unable to send emergency SMS: " + error.getMessage(), error);
            }
        }
    }

    private void finishSmsResult(
        PluginCall call,
        Context context,
        BroadcastReceiver receiver,
        Handler handler,
        AtomicBoolean completed,
        int resultCode,
        int partCount
    ) {
        if (!completed.compareAndSet(false, true)) return;
        handler.removeCallbacksAndMessages(null);
        safelyUnregisterReceiver(context, receiver);

        if (resultCode == Activity.RESULT_OK) {
            JSObject result = new JSObject();
            result.put("sent", true);
            result.put("parts", partCount);
            call.resolve(result);
        } else {
            call.reject("Device SMS was rejected: " + smsErrorMessage(resultCode));
        }
    }

    private void safelyUnregisterReceiver(Context context, BroadcastReceiver receiver) {
        try {
            context.unregisterReceiver(receiver);
        } catch (IllegalArgumentException ignored) {
            // It was already removed after a result or timeout.
        }
    }

    private String smsErrorMessage(int resultCode) {
        switch (resultCode) {
            case SmsManager.RESULT_ERROR_GENERIC_FAILURE:
                return "generic carrier failure";
            case SmsManager.RESULT_ERROR_RADIO_OFF:
                return "mobile radio is off";
            case SmsManager.RESULT_ERROR_NULL_PDU:
                return "invalid message data";
            case SmsManager.RESULT_ERROR_NO_SERVICE:
                return "no mobile network service";
            case SmsManager.RESULT_ERROR_LIMIT_EXCEEDED:
                return "carrier sending limit reached";
            case SmsManager.RESULT_ERROR_SHORT_CODE_NOT_ALLOWED:
            case SmsManager.RESULT_ERROR_SHORT_CODE_NEVER_ALLOWED:
                return "carrier blocked this recipient";
            default:
                return "error code " + resultCode;
        }
    }

    private boolean hasSmsCapability() {
        PackageManager packageManager = getContext().getPackageManager();
        // SmsManager.getDefault() targets the user's selected SMS subscription.
        // getPhoneType() is a legacy check and can return PHONE_TYPE_NONE on
        // modern dual-SIM/LTE devices even though SMS is available.
        return packageManager.hasSystemFeature(PackageManager.FEATURE_TELEPHONY_MESSAGING);
    }
}
