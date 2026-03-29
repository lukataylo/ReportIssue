import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#1B2A4A' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#3A7BD5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E7EB',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: 'Fix It London',
          headerShown: false,
          title: 'Report',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📷</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="my-reports"
        options={{
          headerTitle: 'My Reports',
          title: 'My Reports',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          headerTitle: 'Map',
          title: 'Map',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🗺️</Text>
          ),
        }}
      />
    </Tabs>
  );
}
