import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';
import 'package:uuid/uuid.dart';
import '../../domain/models/grocery_item.dart';
import '../../domain/repositories/grocery_repository.dart';
import '../../data/repositories/grocery_repository_impl.dart';

// Hive Box Name
const String kGroceryBoxName = 'grocery_box';

// Box provider
final groceryBoxProvider = Provider<Box<GroceryItem>>((ref) {
  return Hive.box<GroceryItem>(kGroceryBoxName);
});

// Settings Box provider
final settingsBoxProvider = Provider<Box>((ref) {
  return Hive.box('settings_box');
});

// Repository provider
final groceryRepositoryProvider = Provider<GroceryRepository>((ref) {
  final box = ref.watch(groceryBoxProvider);
  return GroceryRepositoryImpl(box);
});

// Sort option enum
enum GrocerySortOption {
  newestFirst,
  oldestFirst,
  priceHighToLow,
  priceLowToHigh,
  purchasedFirst,
  pendingFirst,
}

// State class for Grocery Features
class GroceryState {
  final List<GroceryItem> items;
  final String searchQuery;
  final GrocerySortOption sortOption;
  final bool isLoading;
  final double totalBudget;

  GroceryState({
    required this.items,
    this.searchQuery = '',
    this.sortOption = GrocerySortOption.newestFirst,
    this.isLoading = false,
    this.totalBudget = 15000.0,
  });

  GroceryState copyWith({
    List<GroceryItem>? items,
    String? searchQuery,
    GrocerySortOption? sortOption,
    bool? isLoading,
    double? totalBudget,
  }) {
    return GroceryState(
      items: items ?? this.items,
      searchQuery: searchQuery ?? this.searchQuery,
      sortOption: sortOption ?? this.sortOption,
      isLoading: isLoading ?? this.isLoading,
      totalBudget: totalBudget ?? this.totalBudget,
    );
  }
}

// StateNotifier for managing the list and state
class GroceryNotifier extends StateNotifier<GroceryState> {
  final GroceryRepository _repository;
  final Box _settingsBox;
  final _uuid = const Uuid();

  GroceryNotifier(this._repository, this._settingsBox) : super(GroceryState(items: [])) {
    loadItems();
  }

  Future<void> loadItems() async {
    state = state.copyWith(isLoading: true);
    try {
      final items = await _repository.getItems();
      final double budget = _settingsBox.get('totalBudget', defaultValue: 15000.0) as double;
      state = state.copyWith(items: items, totalBudget: budget, isLoading: false);
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> addItem({
    required String name,
    required double price,
    String note = '',
  }) async {
    final newItem = GroceryItem(
      id: _uuid.v4(),
      name: name,
      price: price,
      note: note,
      isPurchased: false,
      createdAt: DateTime.now(),
    );
    await _repository.addItem(newItem);
    state = state.copyWith(items: [...state.items, newItem]);
  }

  Future<void> updateItem({
    required String id,
    required String name,
    required double price,
    String note = '',
  }) async {
    final updatedItems = state.items.map((item) {
      if (item.id == id) {
        final updated = item.copyWith(
          name: name,
          price: price,
          note: note,
        );
        _repository.updateItem(updated);
        return updated;
      }
      return item;
    }).toList();
    state = state.copyWith(items: updatedItems);
  }

  Future<void> togglePurchased(String id) async {
    final updatedItems = state.items.map((item) {
      if (item.id == id) {
        final updated = item.copyWith(isPurchased: !item.isPurchased);
        _repository.updateItem(updated);
        return updated;
      }
      return item;
    }).toList();
    state = state.copyWith(items: updatedItems);
  }

  Future<void> deleteItem(String id) async {
    await _repository.deleteItem(id);
    state = state.copyWith(
      items: state.items.where((item) => item.id != id).toList(),
    );
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void setSortOption(GrocerySortOption option) {
    state = state.copyWith(sortOption: option);
  }

  Future<void> setTotalBudget(double budget) async {
    await _settingsBox.put('totalBudget', budget);
    state = state.copyWith(totalBudget: budget);
  }
}

// Main provider definition
final groceryProvider = StateNotifierProvider<GroceryNotifier, GroceryState>((ref) {
  final repository = ref.watch(groceryRepositoryProvider);
  final settingsBox = ref.watch(settingsBoxProvider);
  return GroceryNotifier(repository, settingsBox);
});

// Computed filtering Provider
final filteredGroceryListProvider = Provider<List<GroceryItem>>((ref) {
  final state = ref.watch(groceryProvider);
  var filtered = List<GroceryItem>.from(state.items);

  // Search logic
  if (state.searchQuery.isNotEmpty) {
    final query = state.searchQuery.toLowerCase();
    filtered = filtered.where((item) => item.name.toLowerCase().contains(query)).toList();
  }

  // Sorting logic
  switch (state.sortOption) {
    case GrocerySortOption.newestFirst:
      filtered.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      break;
    case GrocerySortOption.oldestFirst:
      filtered.sort((a, b) => a.createdAt.compareTo(b.createdAt));
      break;
    case GrocerySortOption.priceHighToLow:
      filtered.sort((a, b) => b.price.compareTo(a.price));
      break;
    case GrocerySortOption.priceLowToHigh:
      filtered.sort((a, b) => a.price.compareTo(b.price));
      break;
    case GrocerySortOption.purchasedFirst:
      filtered.sort((a, b) {
        if (a.isPurchased == b.isPurchased) {
          return b.createdAt.compareTo(a.createdAt);
        }
        return a.isPurchased ? -1 : 1;
      });
      break;
    case GrocerySortOption.pendingFirst:
      filtered.sort((a, b) {
        if (a.isPurchased == b.isPurchased) {
          return b.createdAt.compareTo(a.createdAt);
        }
        return a.isPurchased ? 1 : -1;
      });
      break;
  }

  return filtered;
});

// Computed metrics metrics dashboard provider
class ExpenseMetrics {
  final double totalPlanned;
  final double totalPurchased;
  final double totalPending;
  final int totalCount;
  final int purchasedCount;
  final int pendingCount;
  final double totalBudget;
  final double remainingBudget;
  final double budgetSpentPercentage;

  ExpenseMetrics({
    required this.totalPlanned,
    required this.totalPurchased,
    required this.totalPending,
    required this.totalCount,
    required this.purchasedCount,
    required this.pendingCount,
    required this.totalBudget,
    required this.remainingBudget,
    required this.budgetSpentPercentage,
  });
}

final expenseMetricsProvider = Provider<ExpenseMetrics>((ref) {
  final state = ref.watch(groceryProvider);
  
  double totalPlanned = 0.0;
  double totalPurchased = 0.0;
  double totalPending = 0.0;
  
  int totalCount = state.items.length;
  int purchasedCount = 0;
  int pendingCount = 0;

  for (final item in state.items) {
    totalPlanned += item.price;
    if (item.isPurchased) {
      totalPurchased += item.price;
      purchasedCount++;
    } else {
      totalPending += item.price;
      pendingCount++;
    }
  }

  final totalBudget = state.totalBudget;
  final remainingBudget = totalBudget - totalPurchased;
  final budgetSpentPercentage = totalBudget > 0
      ? (totalPurchased / totalBudget) * 100
      : 0.0;

  return ExpenseMetrics(
    totalPlanned: totalPlanned,
    totalPurchased: totalPurchased,
    totalPending: totalPending,
    totalCount: totalCount,
    purchasedCount: purchasedCount,
    pendingCount: pendingCount,
    totalBudget: totalBudget,
    remainingBudget: remainingBudget,
    budgetSpentPercentage: budgetSpentPercentage,
  );
});
