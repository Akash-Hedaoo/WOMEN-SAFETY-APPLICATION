package com.safeera.app;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.telephony.SmsManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

/**
 * Sends an SOS through the active device SIM/eSIM directly from the device.
 */
@CapacitorPlugin(
    name = "EmergencySms",
    permissions = {
        @Permission(alias = "sms", strings = { Manifest.permission.SEND_SMS })
    }
)
public class EmergencySmsPlugin extends Plugin {

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
            SmsManager smsManager = getSmsManager();
            ArrayList<String> parts = smsManager.divideMessage(message);

            if (parts.size() > 1) {
                smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null);
            } else {
                smsManager.sendTextMessage(phoneNumber, null, message, null, null);
            }

            JSObject result = new JSObject();
            result.put("sent", true);
            result.put("parts", parts.size());
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Unable to send emergency SMS: " + error.getMessage(), error);
        }
    }

    private SmsManager getSmsManager() {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            SmsManager manager = context.getSystemService(SmsManager.class);
            if (manager != null) {
                return manager;
            }
        }
        return SmsManager.getDefault();
    }

    private boolean hasSmsCapability() {
        PackageManager packageManager = getContext().getPackageManager();
        return packageManager.hasSystemFeature(PackageManager.FEATURE_TELEPHONY) ||
               packageManager.hasSystemFeature(PackageManager.FEATURE_TELEPHONY_MESSAGING);
    }
}
