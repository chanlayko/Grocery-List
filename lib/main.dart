import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'core/theme/app_theme.dart';
import 'features/grocery/domain/models/grocery_item.dart';
import 'features/grocery/presentation/screens/home_screen.dart';
import 'features/grocery/presentation/providers/grocery_provider.dart';

void main() async {
  // Ensure Flutter engine bindings are initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Hive offline storage database
  await Hive.initFlutter();

  // Register the custom grocery item Hive model adapter
  Hive.registerAdapter(GroceryItemAdapter());

  // Open the primary Hive database box for grocery list persistence
  await Hive.openBox<GroceryItem>(kGroceryBoxName);

  // Run the application bounded by ProviderScope for Riverpod states
  runApp(
    const ProviderScope(
      child: GroceryExpenseApp(),
    ),
  );
}

class GroceryExpenseApp extends ConsumerWidget {
  const GroceryExpenseApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'Grocery List & Expense Tracker',
      debugShowCheckedModeBanner: false,
      
      // Load standard clean light design
      theme: AppTheme.lightTheme,
      
      // Load modern dark design
      darkTheme: AppTheme.darkTheme,
      
      // Default to System configuration
      themeMode: ThemeMode.system,
      
      // Set the home screen component
      home: const HomeScreen(),
    );
  }
}
