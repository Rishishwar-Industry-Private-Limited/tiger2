package com.techori.tiger;

import android.content.Intent;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class CameraServiceModule extends ReactContextBaseJavaModule {
    private static final String TAG = "CameraServiceModule";
    private final ReactApplicationContext reactContext;

    public CameraServiceModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "CameraServiceModule";
    }

    @ReactMethod
    public void startService() {
        Log.d(TAG, "startService called");
        Intent i = new Intent(reactContext, TrackingService.class);
        reactContext.startService(i);
    }

    @ReactMethod
    public void stopService() {
        Log.d(TAG, "stopService called");
        Intent i = new Intent(reactContext, TrackingService.class);
        reactContext.stopService(i);
    }

    @ReactMethod
    public void triggerCapture(Promise promise) {
        // Placeholder: native capture not implemented. Reject promise to indicate not available.
        Log.d(TAG, "triggerCapture called - placeholder");
        promise.reject("NOT_IMPLEMENTED", "Native capture is not implemented in this build.");
    }
}
