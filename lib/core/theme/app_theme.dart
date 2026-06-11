import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: Colors.teal,
        brightness: Brightness.light,
        surface: const Color(0xFFF9FBFB),
      ),
      cardTheme: const CardTheme(
        elevation: 1,
        margin: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: Colors.teal,
        brightness: Brightness.dark,
        surface: const Color(0xFF121818),
      ),
      cardTheme: const CardTheme(
        elevation: 1,
        margin: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
    );
  }
}
