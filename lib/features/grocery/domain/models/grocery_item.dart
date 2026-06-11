import 'package:hive/hive.dart';

part 'grocery_item.g.dart';

@HiveType(typeId: 0)
class GroceryItem extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String name;

  @HiveField(2)
  final double price;

  @HiveField(3)
  final String note;

  @HiveField(4)
  final bool isPurchased;

  @HiveField(5)
  final DateTime createdAt;

  GroceryItem({
    required this.id,
    required this.name,
    required this.price,
    this.note = '',
    this.isPurchased = false,
    required this.createdAt,
  });

  GroceryItem copyWith({
    String? id,
    String? name,
    double? price,
    String? note,
    bool? isPurchased,
    DateTime? createdAt,
  }) {
    return GroceryItem(
      id: id ?? this.id,
      name: name ?? this.name,
      price: price ?? this.price,
      note: note ?? this.note,
      isPurchased: isPurchased ?? this.isPurchased,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
