import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export interface PushNotification {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface MulticastPushNotification {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

/**
 * Send a push notification to a single device
 */
export async function sendPushNotification({
  token,
  title,
  body,
  data,
  imageUrl,
}: PushNotification) {
  try {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: data || {},
      // Android-specific options
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'fire-safety-alerts',
          priority: 'high',
        },
      },
      // iOS-specific options
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
          },
        },
      },
      // Web push options
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          requireInteraction: true,
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('Push notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send push notifications to multiple devices
 */
export async function sendMulticastPushNotification({
  tokens,
  title,
  body,
  data,
  imageUrl,
}: MulticastPushNotification) {
  try {
    if (tokens.length === 0) {
      console.log('No tokens provided for multicast notification');
      return { successCount: 0, failureCount: 0 };
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'fire-safety-alerts',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          requireInteraction: true,
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(
      `Multicast notification sent: ${response.successCount} successful, ${response.failureCount} failed`
    );

    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
        }
      });
      // You might want to remove invalid tokens from your database here
      console.log('Failed tokens:', failedTokens);
    }

    return response;
  } catch (error) {
    console.error('Error sending multicast push notification:', error);
    throw error;
  }
}

/**
 * Subscribe a token to a topic
 */
export async function subscribeToTopic(tokens: string[], topic: string) {
  try {
    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    console.log(`Successfully subscribed to topic ${topic}:`, response);
    return response;
  } catch (error) {
    console.error(`Error subscribing to topic ${topic}:`, error);
    throw error;
  }
}

/**
 * Unsubscribe a token from a topic
 */
export async function unsubscribeFromTopic(tokens: string[], topic: string) {
  try {
    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    console.log(`Successfully unsubscribed from topic ${topic}:`, response);
    return response;
  } catch (error) {
    console.error(`Error unsubscribing from topic ${topic}:`, error);
    throw error;
  }
}

/**
 * Send notification to a topic
 */
export async function sendTopicNotification(
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const message: admin.messaging.Message = {
      topic,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'fire-safety-alerts',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`Topic notification sent to ${topic}:`, response);
    return response;
  } catch (error) {
    console.error(`Error sending topic notification to ${topic}:`, error);
    throw error;
  }
}
