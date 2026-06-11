import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../domain/models/grocery_item.dart';
import '../providers/grocery_provider.dart';
import 'add_edit_item_dialog.dart';

class GroceryItemCard extends ConsumerWidget {
  final GroceryItem item;

  const GroceryItemCard({super.key, required this.item});

  void _showDeleteConfirmation(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Grocery Item?'),
        content: Text('Are you sure you want to delete "${item.name}" from your list?'),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              ref.read(groceryProvider.notifier).deleteItem(item.id);
              Navigator.of(ctx).pop();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
              foregroundColor: Theme.of(context).colorScheme.onError,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _showEditSheet(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AddEditItemDialog(item: item),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final formattedDate = DateFormat('MMM d, yyyy • h:mm a').format(item.createdAt);

    return Card(
      elevation: 0,
      color: item.isPurchased 
          ? theme.colorScheme.surfaceVariant.withOpacity(0.4)
          : theme.colorScheme.surfaceVariant.withOpacity(0.15),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: item.isPurchased
              ? theme.colorScheme.outlineVariant.withOpacity(0.3)
              : theme.colorScheme.outlineVariant.withOpacity(0.7),
          width: 1,
        ),
      ),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Transform.scale(
          scale: 1.1,
          child: Checkbox(
            value: item.isPurchased,
            activeColor: theme.colorScheme.primary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            onChanged: (_) {
              ref.read(groceryProvider.notifier).togglePurchased(item.id);
            },
          ),
        ),
        title: Text(
          item.name,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
            decoration: item.isPurchased ? TextDecoration.lineThrough : null,
            color: item.isPurchased ? theme.colorScheme.outline : theme.colorScheme.onSurface,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              '¥${item.price.toStringAsFixed(0)}',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: item.isPurchased ? theme.colorScheme.outline : theme.colorScheme.primary,
              ),
            ),
            if (item.note.isNotEmpty) ...[
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface.withOpacity(0.6),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.notes_rounded, 
                      size: 13, 
                      color: theme.colorScheme.onSurfaceVariant.withOpacity(0.7)
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        item.note,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant.withOpacity(0.8),
                          fontStyle: FontStyle.italic,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 6),
            Text(
              formattedDate,
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.outline.withOpacity(0.7),
                fontSize: 10,
              ),
            ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit_outlined, size: 20),
              tooltip: 'Edit Item',
              onPressed: () => _showEditSheet(context),
            ),
            IconButton(
              icon: Icon(Icons.delete_outline_rounded, color: theme.colorScheme.error, size: 20),
              tooltip: 'Delete Item',
              onPressed: () => _showDeleteConfirmation(context, ref),
            ),
          ],
        ),
      ),
    );
  }
}
