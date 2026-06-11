import '../models/grocery_item.dart';

abstract class GroceryRepository {
  Future<List<GroceryItem>> getItems();
  Future<void> addItem(GroceryItem item);
  Future<void> updateItem(GroceryItem item);
  Future<void> deleteItem(String id);
}
