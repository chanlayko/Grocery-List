import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/grocery_provider.dart';
import '../widgets/grocery_item_card.dart';
import '../widgets/add_edit_item_dialog.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  void _showSortBottomSheet(
      BuildContext context, WidgetRef ref, GrocerySortOption currentOption) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(20.0),
                child: Text(
                  'Sort Grocery Items',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
              const Divider(height: 1),
              ...GrocerySortOption.values.map((option) {
                String label;
                IconData icon;
                switch (option) {
                  case GrocerySortOption.newestFirst:
                    label = 'Newest First';
                    icon = Icons.calendar_today_rounded;
                    break;
                  case GrocerySortOption.oldestFirst:
                    label = 'Oldest First';
                    icon = Icons.history_rounded;
                    break;
                  case GrocerySortOption.priceHighToLow:
                    label = 'Price: High to Low';
                    icon = Icons.arrow_downward_rounded;
                    break;
                  case GrocerySortOption.priceLowToHigh:
                    label = 'Price: Low to High';
                    icon = Icons.arrow_upward_rounded;
                    break;
                  case GrocerySortOption.purchasedFirst:
                    label = 'Purchased Items First';
                    icon = Icons.check_circle_outline_rounded;
                    break;
                  case GrocerySortOption.pendingFirst:
                    label = 'Pending Items First';
                    icon = Icons.pending_outlined;
                    break;
                }

                return RadioListTile<GrocerySortOption>(
                  title: Row(
                    children: [
                      Icon(icon,
                          size: 20,
                          color: Theme.of(context).colorScheme.primary),
                      const SizedBox(width: 12),
                      Text(label,
                          style: const TextStyle(fontWeight: FontWeight.w500)),
                    ],
                  ),
                  value: option,
                  groupValue: currentOption,
                  activeColor: Theme.of(context).colorScheme.primary,
                  onChanged: (val) {
                    if (val != null) {
                      ref.read(groceryProvider.notifier).setSortOption(val);
                      Navigator.of(ctx).pop();
                    }
                  },
                );
              }).toList(),
            ],
          ),
        ),
      ),
    );
  }

  void _showAddDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const AddEditItemDialog(),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(groceryProvider);
    final filteredItems = ref.watch(filteredGroceryListProvider);
    final metrics = ref.watch(expenseMetricsProvider);
    final theme = Theme.of(context);

    // Filter items into pending and purchased lists
    final pendingItems =
        filteredItems.where((item) => !item.isPurchased).toList();
    final purchasedItems =
        filteredItems.where((item) => item.isPurchased).toList();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.shopping_cart_checkout_rounded,
                color: theme.colorScheme.primary),
            const SizedBox(width: 8),
            const Text(
              'Grocery & Expense Tracker',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(
              Theme.of(context).brightness == Brightness.dark
                  ? Icons.light_mode_rounded
                  : Icons.dark_mode_rounded,
            ),
            tooltip: 'Toggle Theme',
            onPressed: () {
              // Note: The host container/simulator manages theme toggling dynamically
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // 1. TOP EXPENSE DASHBOARD CARD
          _buildDashboard(context, metrics),

          // 2. SEARCH & SORT BAR
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: InputDecoration(
                      labelText: 'Search items...',
                      hintText: 'e.g. Apples, Milk',
                      prefixIcon: const Icon(Icons.search_rounded),
                      filled: true,
                      fillColor:
                          theme.colorScheme.surfaceVariant.withOpacity(0.15),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                            color: theme.colorScheme.outlineVariant
                                .withOpacity(0.5)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                            color: theme.colorScheme.outlineVariant
                                .withOpacity(0.3)),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                          vertical: 0, horizontal: 16),
                    ),
                    onChanged: (text) {
                      ref.read(groceryProvider.notifier).setSearchQuery(text);
                    },
                  ),
                ),
                const SizedBox(width: 12),
                InkWell(
                  onTap: () =>
                      _showSortBottomSheet(context, ref, state.sortOption),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color:
                                theme.colorScheme.primary.withOpacity(0.15))),
                    child: Icon(
                      Icons.tune_rounded,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                )
              ],
            ),
          ),

          // 3. MAIN SCROLLABLE LIST OF SECTIONS
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.items.isEmpty
                    ? _buildEmptyState(context,
                        'No grocery items yet.\nTap the + button to add an item.')
                    : filteredItems.isEmpty
                        ? _buildEmptyState(context,
                            'No matching items\nfound for your search.')
                        : _buildSections(context, pendingItems, purchasedItems),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddDialog(context),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add Item',
            style: TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildDashboard(BuildContext context, ExpenseMetrics metrics) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primaryContainer.withOpacity(0.7),
            theme.colorScheme.secondaryContainer.withOpacity(0.3),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.primary.withOpacity(0.15),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Expense Dashboard',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onPrimaryContainer,
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${metrics.totalCount} ${metrics.totalCount == 1 ? "Item" : "Items"}',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Expenses Row
          Row(
            children: [
              Expanded(
                child: _buildMetricTile(
                  context,
                  'Planned Total',
                  '¥${metrics.totalPlanned.toStringAsFixed(0)}',
                  Icons.receipt_long,
                  theme.colorScheme.onPrimaryContainer,
                ),
              ),
              Expanded(
                child: _buildMetricTile(
                  context,
                  'Purchased',
                  '¥${metrics.totalPurchased.toStringAsFixed(0)}',
                  Icons.check_circle,
                  Colors.green,
                ),
              ),
              Expanded(
                child: _buildMetricTile(
                  context,
                  'Pending',
                  '¥${metrics.totalPending.toStringAsFixed(0)}',
                  Icons.pending,
                  Colors.amber.shade800,
                ),
              ),
            ],
          ),
          const Divider(height: 24, thickness: 0.5),
          // Counts Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildSimpleCountChip(
                  context,
                  'Total: ${metrics.totalCount}',
                  Icons.assignment_turned_in_outlined,
                  theme.colorScheme.primary),
              _buildSimpleCountChip(
                  context,
                  'Purchased: ${metrics.purchasedCount}',
                  Icons.check_outlined,
                  Colors.green),
              _buildSimpleCountChip(context, 'Pending: ${metrics.pendingCount}',
                  Icons.timer_outlined, Colors.amber.shade800),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildMetricTile(BuildContext context, String title, String amount,
      IconData icon, Color amountColor) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon,
                size: 14,
                color: theme.colorScheme.onSurfaceVariant.withOpacity(0.6)),
            const SizedBox(width: 4),
            Text(
              title,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant.withOpacity(0.7),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          amount,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: amountColor,
          ),
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildSimpleCountChip(
      BuildContext context, String text, IconData icon, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(
          text,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(BuildContext context, String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.shopping_basket_outlined,
            size: 64,
            color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Theme.of(context).colorScheme.outline,
              fontSize: 16,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSections(
      BuildContext context, List<dynamic> pending, List<dynamic> purchased) {
    final theme = Theme.of(context);
    final countPending = pending.length;
    final countPurchased = purchased.length;

    return ListView(
      physics: const BouncingScrollPhysics(),
      children: [
        // 1. PENDING SECTION
        if (countPending > 0) ...[
          _buildSectionHeader(context, 'Pending Items ($countPending)',
              Icons.hourglass_top, theme.colorScheme.primary),
          ...pending.map((item) => GroceryItemCard(item: item)),
        ],

        // Spacing if both exist
        if (countPending > 0 && countPurchased > 0) const SizedBox(height: 16),

        // 2. PURCHASED SECTION
        if (countPurchased > 0) ...[
          _buildSectionHeader(context, 'Purchased Items ($countPurchased)',
              Icons.task_alt, Colors.green),
          ...purchased.map((item) => GroceryItemCard(item: item)),
        ],
      ],
    );
  }

  Widget _buildSectionHeader(
      BuildContext context, String title, IconData icon, Color color) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(left: 20, right: 20, top: 12, bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 8),
          Text(
            title,
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Divider(
              color: color.withOpacity(0.2),
              thickness: 1,
            ),
          ),
        ],
      ),
    );
  }
}
