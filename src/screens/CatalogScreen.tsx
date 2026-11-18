import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { UrbanBackground } from '../components/UrbanBackground';
import { GlassCard } from '../components/GlassCard';
import { colors, radius, spacing } from '../theme/tokens';
import { products, formatCOP, Product } from '../data/products';

const categories = ['Todo', 'Chaquetas', 'Jeans', 'Vestidos'] as const;

type Props = {
  onOpenProduct: (product: Product) => void;
};

export function CatalogScreen({ onOpenProduct }: Props) {
  const [active, setActive] = useState<(typeof categories)[number]>('Todo');
  const [query, setQuery] = useState('');

  const filtered = products.filter((p) => {
    const byCategory = active === 'Todo' || p.category.toLowerCase() === active.toLowerCase();
    const byQuery = p.name.toLowerCase().includes(query.toLowerCase());
    return byCategory && byQuery;
  });

  return (
    <View style={styles.root}>
      <UrbanBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Buenas tardes</Text>
            <Text style={styles.title}>Tu marca</Text>
          </View>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar chaquetas, jeans, vestidos"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Buscar productos"
          style={styles.search}
        />

        <View style={styles.chips}>
          {categories.map((c) => {
            const isActive = c === active;
            return (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => setActive(c)}
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${formatCOP(item.price)}`}
              onPress={() => onOpenProduct(item)}
              style={styles.cardWrap}
            >
              <GlassCard style={styles.card} intensity={25}>
                <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" transition={200} />
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>{formatCOP(item.price)}</Text>
              </GlassCard>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    color: colors.textMuted,
    fontSize: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  search: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.textOnAccent,
    fontWeight: '500',
  },
  list: {
    paddingBottom: 120,
    gap: spacing.md,
  },
  column: {
    gap: spacing.md,
  },
  cardWrap: {
    flex: 1,
  },
  card: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  thumb: {
    height: 170,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
  },
  productName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 6,
  },
  productPrice: {
    color: colors.textMuted,
    fontSize: 13,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
});
