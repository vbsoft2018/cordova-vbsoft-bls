/**
    Author By VBSoft
 */
package cn.vbsoft.bls;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.UUID;
import java.util.Arrays;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothServerSocket;
import android.bluetooth.BluetoothSocket;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * This class does all the work for setting up and managing Bluetooth
 * connections with other devices. It has a thread that listens for
 * incoming connections, a thread for connecting with a device, and a
 * thread for performing data transmissions when connected.
 *
 * This code was based on the Android SDK BluetoothChat Sample
 * $ANDROID_SDK/samples/android-17/BluetoothChat
 */
public class VBSoftBlsService {

    // Debugging
    private static final String TAG = "VBSoftBlsService";
    private static final boolean D = true;

    // Name for the SDP record when creating server socket
    private static final String NAME_SECURE = "PhoneGapVBSoftBlsServiceSecure";
    private static final String NAME_INSECURE = "PhoneGapVBSoftBlsServiceInSecure";

    // Unique UUID for this application
    private static final UUID MY_UUID_SECURE = UUID.fromString("7A9C3B55-78D0-44A7-A94E-A93E3FE118CE");
    private static final UUID MY_UUID_INSECURE = UUID.fromString("23F18142-B389-4772-93BD-52BDBB2C03E9");

    // Well known SPP UUID
    private static final UUID UUID_SPP = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    // Member fields
    private final BluetoothAdapter mAdapter;
    private final Handler mHandler;
    private AcceptThread mSecureAcceptThread;
    private AcceptThread mInsecureAcceptThread;
    private ConnectThread mConnectThread;
    private ConnectedThread mConnectedThread;
    private int mState;
    private int mType;

    // Constants that indicate the current connection state
    public static final int STATE_NONE = 0;       // we're doing nothing
    public static final int STATE_LISTEN = 1;     // now listening for incoming connections
    public static final int STATE_CONNECTING = 2; // now initiating an outgoing connection
    public static final int STATE_CONNECTED = 3;  // now connected to a remote device

    public static final int IS_LISTEN = 1;     // now listening for incoming connections
    public static final int NOT_LISTEN = 0;  // now connected to a remote device

    /**
     * Constructor. Prepares a new VBSoftBls session.
     * @param handler  A Handler to send messages back to the UI Activity
     */
    public VBSoftBlsService(Handler handler) {
        mAdapter = BluetoothAdapter.getDefaultAdapter();
        mState = STATE_NONE;
        mHandler = handler;
    }

    /**
     * Set the current state of the chat connection
     * @param state  An integer defining the current connection state
     */
    private synchronized void setState(int state) {
        if (D) Log.d(TAG, "setState() " + mState + " -> " + state);
        mState = state;
        // Give the new state to the Handler so the UI Activity can update
        mHandler.obtainMessage(VBSoftBls.MESSAGE_STATE_CHANGE, state, -1).sendToTarget();
    }
    private synchronized void setType(int type) {
        if (D) Log.d(TAG, "setState() " + mType + " -> " + type);
        mType = type;
        // Give the new state to the Handler so the UI Activity can update
        mHandler.obtainMessage(VBSoftBls.MESSAGE_TYPE_CHANGE, type, -1).sendToTarget();
    }

    /**
     * Return the current connection state. */
    public synchronized int getState() {
        return mState;
    }
    /**
     * Return the current connection state. */
    public synchronized int getType() {
        return mType;
    }
    public synchronized void listen(){
        if (D) Log.d(TAG, "listen");
        if (mConnectThread != null) {mConnectThread.cancel(); mConnectThread = null;}
        if (mConnectedThread != null) {mConnectedThread.cancel(); mConnectedThread = null;}
        setState(STATE_NONE);
        if (mSecureAcceptThread == null) {
            mSecureAcceptThread = new AcceptThread(true);
            mSecureAcceptThread.start();
        }
        setState(STATE_LISTEN);
        setType(IS_LISTEN);
    }
    /**
     * Start the chat service. Specifically start AcceptThread to begin a
     * session in listening (server) mode. Called by the Activity onResume() */
    public synchronized void start() {
        if (D) Log.d(TAG, "start");
        // Cancel any thread attempting to make a connection
        if (mConnectThread != null) {mConnectThread.cancel(); mConnectThread = null;}
        // Cancel any thread currently running a connection
        if (mConnectedThread != null) {mConnectedThread.cancel(); mConnectedThread = null;}
        setState(STATE_NONE);
        setType(NOT_LISTEN);
    }

    /**
     * Start the ConnectThread to initiate a connection to a remote device.
     * @param device  The BluetoothDevice to connect
     * @param secure Socket Security type - Secure (true) , Insecure (false)
     */
    public synchronized void connect(BluetoothDevice device, boolean secure) {
        if (D) Log.d(TAG, "connect to: " + device);

        // Cancel any thread attempting to make a connection
        if (mState == STATE_CONNECTING) {
            if (mConnectThread != null) {mConnectThread.cancel(); mConnectThread = null;}
        }

        // Cancel any thread currently running a connection
        if (mConnectedThread != null) {mConnectedThread.cancel(); mConnectedThread = null;}

        // Start the thread to connect with the given device
        mConnectThread = new ConnectThread(device, secure);
        mConnectThread.start();
        setState(STATE_CONNECTING);
    }

    /**
     * Start the ConnectedThread to begin managing a Bluetooth connection
     * @param socket  The BluetoothSocket on which the connection was made
     * @param device  The BluetoothDevice that has been connected
     */
    public synchronized void connected(BluetoothSocket socket, BluetoothDevice device, final String socketType) {
        if (D) Log.d(TAG, "connected, Socket Type:" + socketType);

        // Cancel the thread that completed the connection
        if (mConnectThread != null) {mConnectThread.cancel(); mConnectThread = null;}

        // Cancel any thread currently running a connection
        if (mConnectedThread != null) {mConnectedThread.cancel(); mConnectedThread = null;}

        // Cancel the accept thread because we only want to connect to one device
        if (mSecureAcceptThread != null) {
            mSecureAcceptThread.cancel();
            mSecureAcceptThread = null;
        }
        if (mInsecureAcceptThread != null) {
            mInsecureAcceptThread.cancel();
            mInsecureAcceptThread = null;
        }

        // Start the thread to manage the connection and perform transmissions
        mConnectedThread = new ConnectedThread(socket, socketType);
        mConnectedThread.start();

        // Send the name of the connected device back to the UI Activity
        if(mType==NOT_LISTEN){
            Message msg = mHandler.obtainMessage(VBSoftBls.MESSAGE_DEVICE_NAME);
            Bundle bundle = new Bundle();
            bundle.putString(VBSoftBls.DEVICE_NAME, device.getName());
            msg.setData(bundle);
            mHandler.sendMessage(msg);
            if (D) Log.d(TAG, "connected, DEVICE_NAME:" + VBSoftBls.DEVICE_NAME);
        }else if(mType==IS_LISTEN){
            try {
                JSONObject json = new JSONObject();
                json.put("name", device.getName());
                json.put("address", device.getAddress());
                json.put("id", device.toString());
                json.put("bondState", device.getBondState());
                if (device.getBluetoothClass() != null) {
                    json.put("class", device.getBluetoothClass().getDeviceClass());
                }
                Message msg = mHandler.obtainMessage(VBSoftBls.MESSAGE_DEVICE_INFO);
                Bundle bundle = new Bundle();
                bundle.putString(VBSoftBls.DEVICE_INFO, json.toString());
                msg.setData(bundle);
                mHandler.sendMessage(msg);
                if (D) Log.d(TAG, "connected, device:" + json.toString());
            } catch (JSONException e) {
                e.printStackTrace();
            } catch (NullPointerException e) {
                e.printStackTrace();
            }
        }

        setState(STATE_CONNECTED);
    }
    /**
     * Stop all threads
     */
    public synchronized void stop() {
        if (D) Log.d(TAG, "stop");

        if (mConnectThread != null) {
            mConnectThread.cancel();
            mConnectThread = null;
        }

        if (mConnectedThread != null) {
            mConnectedThread.cancel();
            mConnectedThread = null;
        }

        if (mSecureAcceptThread != null) {
            mSecureAcceptThread.cancel();
            mSecureAcceptThread = null;
        }

        if (mInsecureAcceptThread != null) {
            mInsecureAcceptThread.cancel();
            mInsecureAcceptThread = null;
        }
        setState(STATE_NONE);
    }

    /**
     * Write to the ConnectedThread in an unsynchronized manner
     * @param out The bytes to write
     * @see ConnectedThread#write(byte[])
     */
    public void write(byte[] out) {
        // Create temporary object
        ConnectedThread r;
        // Synchronize a copy of the ConnectedThread
        synchronized (this) {
            if (mState != STATE_CONNECTED) return;
            r = mConnectedThread;
        }
        // Perform the write unsynchronized
        r.write(out);
    }

    /**
     * Indicate that the connection attempt failed and notify the UI Activity.
     */
    private void connectionFailed() {
        // Send a failure message back to the Activity
        Message msg = mHandler.obtainMessage(VBSoftBls.MESSAGE_TOAST);
        Bundle bundle = new Bundle();
        bundle.putString(VBSoftBls.TOAST, "Unable to connect to device");
        msg.setData(bundle);
        mHandler.sendMessage(msg);

        // Start the service over to restart listening mode
        if(mType==NOT_LISTEN){
            VBSoftBlsService.this.start();
        }else if(mType==IS_LISTEN){
            VBSoftBlsService.this.listen();
        }
    }

    /**
     * Indicate that the connection was lost and notify the UI Activity.
     */
    private void connectionLost() {
        // Send a failure message back to the Activity

        // Start the service over to restart listening mode
        if(mType==NOT_LISTEN){
            Message msg = mHandler.obtainMessage(VBSoftBls.MESSAGE_TOAST);
            Bundle bundle = new Bundle();
            bundle.putString(VBSoftBls.TOAST, "Device connection was lost");
            msg.setData(bundle);
            mHandler.sendMessage(msg);
            VBSoftBlsService.this.start();
        }else if(mType==IS_LISTEN){
            Message msg = mHandler.obtainMessage(VBSoftBls.MESSAGE_RE_LISTEN);
            Bundle bundle = new Bundle();
            msg.setData(bundle);
            mHandler.sendMessage(msg);
            VBSoftBlsService.this.listen();
        }
    }

    /**
     * This thread runs while listening for incoming connections. It behaves
     * like a server-side client. It runs until a connection is accepted
     * (or until cancelled).
     */
    private class AcceptThread extends Thread {
        // The local server socket
        private final BluetoothServerSocket mmServerSocket;
        private String mSocketType;

        public AcceptThread(boolean secure) {
            BluetoothServerSocket tmp = null;
            mSocketType = secure ? "Secure":"Insecure";

            // Create a new listening server socket
            try {
                if (secure) {
                    // tmp = mAdapter.listenUsingRfcommWithServiceRecord(NAME_SECURE, MY_UUID_SECURE);
                    tmp = mAdapter.listenUsingRfcommWithServiceRecord(NAME_SECURE, UUID_SPP);
                } else {
                    // tmp = mAdapter.listenUsingInsecureRfcommWithServiceRecord(NAME_INSECURE, MY_UUID_INSECURE);
                    tmp = mAdapter.listenUsingInsecureRfcommWithServiceRecord(NAME_INSECURE, UUID_SPP);
                }
            } catch (IOException e) {
                Log.e(TAG, "Socket Type: " + mSocketType + "listen() failed", e);
            }
            mmServerSocket = tmp;
        }

        public void run() {
            if (D) Log.d(TAG, "Socket Type: " + mSocketType + "BEGIN mAcceptThread" + this);
            setName("AcceptThread" + mSocketType);

            BluetoothSocket socket;

            // Listen to the server socket if we're not connected
            while (mState != STATE_CONNECTED) {
                try {
                    // This is a blocking call and will only return on a
                    // successful connection or an exception
                    socket = mmServerSocket.accept();
                } catch (IOException e) {
                    Log.e(TAG, "Socket Type: " + mSocketType + "accept() failed", e);
                    break;
                }

                // If a connection was accepted
                if (socket != null) {
                    synchronized (VBSoftBlsService.this) {
                        switch (mState) {
                            case STATE_LISTEN:
                            case STATE_CONNECTING:
                                // Situation normal. Start the connected thread.
                                connected(socket, socket.getRemoteDevice(),
                                        mSocketType);
                                break;
                            case STATE_NONE:
                            case STATE_CONNECTED:
                                // Either not ready or already connected. Terminate new socket.
                                try {
                                    socket.close();
                                } catch (IOException e) {
                                    Log.e(TAG, "Could not close unwanted socket", e);
                                }
                                break;
                        }
                    }
                }
            }
            if (D) Log.i(TAG, "END mAcceptThread, socket Type: " + mSocketType);

        }

        public void cancel() {
            if (D) Log.d(TAG, "Socket Type" + mSocketType + "cancel " + this);
            try {
                mmServerSocket.close();
            } catch (IOException e) {
                Log.e(TAG, "Socket Type" + mSocketType + "close() of server failed", e);
            }
        }
    }


    /**
     * This thread runs while attempting to make an outgoing connection
     * with a device. It runs straight through; the connection either
     * succeeds or fails.
     */
    private class ConnectThread extends Thread {
        private /*final*/ BluetoothSocket mmSocket;
        private final BluetoothDevice mmDevice;
        private String mSocketType;

        public ConnectThread(BluetoothDevice device, boolean secure) {
            mmDevice = device;
            BluetoothSocket tmp = null;
            mSocketType = secure ? "Secure" : "Insecure";

            // Get a BluetoothSocket for a connection with the given BluetoothDevice
            try {
                if (secure) {
                    // tmp = device.createRfcommSocketToServiceRecord(MY_UUID_SECURE);
                    tmp = device.createRfcommSocketToServiceRecord(UUID_SPP);
                } else {
                    //tmp = device.createInsecureRfcommSocketToServiceRecord(MY_UUID_INSECURE);
                    tmp = device.createInsecureRfcommSocketToServiceRecord(UUID_SPP);
                }
            } catch (IOException e) {
                Log.e(TAG, "Socket Type: " + mSocketType + "create() failed", e);
            }
            mmSocket = tmp;
        }

        public void run() {
            Log.i(TAG, "BEGIN mConnectThread SocketType:" + mSocketType);
            setName("ConnectThread" + mSocketType);

            // Always cancel discovery because it will slow down a connection
            mAdapter.cancelDiscovery();

            // Make a connection to the BluetoothSocket
            try {
                // This is a blocking call and will only return on a successful connection or an exception
                Log.i(TAG,"Connecting to socket...");
                mmSocket.connect();
                Log.i(TAG,"Connected");
            } catch (IOException e) {
                Log.e(TAG, e.toString());

                // Some 4.1 devices have problems, try an alternative way to connect
                // See https://github.com/don/VBSoftBls/issues/89
                try {
                    Log.i(TAG,"Trying fallback...");
                    mmSocket = (BluetoothSocket) mmDevice.getClass().getMethod("createRfcommSocket", new Class[] {int.class}).invoke(mmDevice,1);
                    mmSocket.connect();
                    Log.i(TAG,"Connected");
                } catch (Exception e2) {
                    Log.e(TAG, "Couldn't establish a Bluetooth connection.");
                    try {
                        mmSocket.close();
                    } catch (IOException e3) {
                        Log.e(TAG, "unable to close() " + mSocketType + " socket during connection failure", e3);
                    }
                    connectionFailed();
                    return;
                }
            }

            // Reset the ConnectThread because we're done
            synchronized (VBSoftBlsService.this) {
                mConnectThread = null;
            }

            // Start the connected thread
            connected(mmSocket, mmDevice, mSocketType);
        }

        public void cancel() {
            try {
                mmSocket.close();
            } catch (IOException e) {
                Log.e(TAG, "close() of connect " + mSocketType + " socket failed", e);
            }
        }
    }

    /**
     * This thread runs during a connection with a remote device.
     * It handles all incoming and outgoing transmissions.
     */
    private class ConnectedThread extends Thread {
        private final BluetoothSocket mmSocket;
        private final InputStream mmInStream;
        private final OutputStream mmOutStream;

        public ConnectedThread(BluetoothSocket socket, String socketType) {
            Log.d(TAG, "create ConnectedThread: " + socketType);
            mmSocket = socket;
            InputStream tmpIn = null;
            OutputStream tmpOut = null;

            // Get the BluetoothSocket input and output streams
            try {
                tmpIn = socket.getInputStream();
                tmpOut = socket.getOutputStream();
            } catch (IOException e) {
                Log.e(TAG, "temp sockets not created", e);
            }

            mmInStream = tmpIn;
            mmOutStream = tmpOut;
        }

        public void run() {
            Log.i(TAG, "BEGIN mConnectedThread");
            byte[] buffer = new byte[1024];
            int bytes;

            // Keep listening to the InputStream while connected
            while (true) {
                try {
                    // Read from the InputStream
                    bytes = mmInStream.read(buffer);
                    String data = new String(buffer, 0, bytes);

                    // Send the new data String to the UI Activity
                    mHandler.obtainMessage(VBSoftBls.MESSAGE_READ, data).sendToTarget();

                    // Send the raw bytestream to the UI Activity.
                    // We make a copy because the full array can have extra data at the end
                    // when / if we read less than its size.
                    Log.i(TAG, "bytes:"+bytes);
                    if (bytes > 0) {
                        byte[] rawdata = Arrays.copyOf(buffer, bytes);
                        mHandler.obtainMessage(VBSoftBls.MESSAGE_READ_RAW, rawdata).sendToTarget();
                    }

                } catch (IOException e) {
                    Log.e(TAG, "disconnected", e);
                    connectionLost();
                    // Start the service over to restart listening mode
                    break;
                }
            }
        }

        /**
         * Write to the connected OutStream.
         * @param buffer  The bytes to write
         */
        public void write(byte[] buffer) {
            try {
                mmOutStream.write(buffer);

                // Share the sent message back to the UI Activity
                mHandler.obtainMessage(VBSoftBls.MESSAGE_WRITE, -1, -1, buffer).sendToTarget();

            } catch (IOException e) {
                Log.e(TAG, "Exception during write", e);
            }
        }

        public void cancel() {
            try {
                mmSocket.close();
            } catch (IOException e) {
                Log.e(TAG, "close() of connect socket failed", e);
            }
        }
    }
}