import { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { CATEGORIES, CATEGORY_GROUPS, Category } from '@fixitlondon/shared';

export default function CategoriesScreen() {
  const router = useRouter();

  const handleSelect = useCallback(
    (category: Category) => {
      router.push({ pathname: '/report/new', params: { categoryId: category.id } });
    },
    [router]
  );

  return (
    <>
      <Stack.Screen options={{ headerTitle: 'Choose Category' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {CATEGORY_GROUPS.map((group) => {
          const groupCategories = CATEGORIES.filter((c) => c.group === group.id);
          if (groupCategories.length === 0) return null;

          return (
            <View key={group.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{group.title}</Text>
              {groupCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.card, { borderLeftColor: category.color }]}
                  onPress={() => handleSelect(category)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardIcon}>{category.icon}</Text>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{category.title}</Text>
                    <Text style={styles.cardSubtitle}>{category.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  content: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 3,
    elevation: 1, marginBottom: 6,
  },
  cardIcon: { fontSize: 26, marginRight: 12 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  cardSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 1 },
});
