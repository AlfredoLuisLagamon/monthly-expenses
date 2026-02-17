module.exports = {
  expo: {
    name: 'monthly-expenses',
    slug: 'monthly-expenses',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    updates: {
      enabled: false,
    },
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.derf10.monthlyexpenses',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-router'],
    extra: {
      router: {},
      eas: {
        projectId: 'a125d9e6-ca8d-4d07-8f3a-e73a96797a9f',
      },
      apiUrl: (process.env.EXPO_PUBLIC_API_URL || 'https://monthly-expenses-api.fly.dev').replace(/\/$/, ''),
    },
    owner: 'derf10',
  },
};
