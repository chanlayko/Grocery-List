import 'package:hive/hive.dart';
import '../../domain/models/grocery_item.dart';
import '../../domain/repositories/grocery_repository.dart';

class GroceryRepositoryImpl implements GroceryRepository {
  final Box<GroceryItem> _box;

  GroceryRepositoryImpl(this._box);

  @override
  Future<List<GroceryItem>> getItems() async {
    return _box.values.toList();
  }

  @override
  Future<void> addItem(GroceryItem item) async {
    await _box.put(item.id, item);
  }

  @override
  Future<void> updateItem(GroceryItem item) async {
    await _box.put(item.id, item);
  }

  @override
  Future<void> deleteItem(String id) async {
    await _box.delete(id);
  }
}
