import { Stack } from 'expo-router';

export default function ReportDetailLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1B2A4A' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        headerBackTitle: 'Back',
      }}
    />
  );
}
