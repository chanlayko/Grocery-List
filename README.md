# Grocery List & Expense Tracker (Flutter)

A modern, offline-first mobile application designed to help users track their shopping items, plan budgets, examine purchased stats, and monitor grocery expenses in real-time. Built entirely inside **Flutter** using **Material Design 3**, **Riverpod** for declarative state management, and **Hive** for snappy local offline persistence.

---

## 📱 Core Features Included
1. **Dynamic Dashboard Analytics**: Real-time summaries calculating:
   - *Total Planned Expense*
   - *Total Purchased Expense*
   - *Total Pending Expense*
   - *Total number of grocery items, partitioned into pending and completed groups*
2. **Item Addition, Editing, and Deletion**: Comprehensive validations preventing negative pricing, empty names, or invalid note forms. Comes with custom safety confirmations before deletion.
3. **Structured Dual List Sections**: Displays both *Pending Items* and *Purchased Items* separately on the same screen.
4. **Instant Toggle Mechanics**: Responsive checkbox interactions to immediately mark items as bought, which recalculates cost statistics instantly.
5. **Real-time Search Filter**: Live textual lookup that processes names instantly as you type.
6. **Six Multi-Directional Sort Actions**: Filters lists on criteria like Name sort, dates (newest/oldest), price tiers (high-low/low-high), or groupings (purchased/pending).
7. **Complete Snappy Local Storage**: Loads state data cleanly on startup using Hive boxes; works entirely offline with zero external network requisites or cloud endpoints.

---

## 🏗️ Architecture & Project Structure
This app implements **Clean Architecture** combined with a **Feature-Based Module** approach. This guarantees highly legible separations, scalability, testability, and isolated state representations.

```text
lib/
├── core/
│   └── theme/
│       └── app_theme.dart             # Material 3 light/dark palette declarations
├── features/
│   └── grocery/
│       ├── data/
│       │   └── repositories/
│       │       └── grocery_repository_impl.dart  # Hive box database interactions
│       ├── domain/
│       │   ├── models/
│       │   │   ├── grocery_item.dart             # Database fields & copyWith model
│       │   │   └── grocery_item.g.dart           # Pre-compiled Hive TypeAdapter
│       │   └── repositories/
│       │       └── grocery_repository.dart       # Abstract repository interface CONTRACTS
│       ├── presentation/
│       │   ├── providers/
│       │   │   └── grocery_provider.dart         # StateNotifiers, selectors, and metric providers
│       │   ├── screens/
│       │   │   └── home_screen.dart              # Core app shell with dashboard, search, and dual lists
│       │   └── widgets/
│       │       ├── grocery_item_card.dart        # Individual reactive checkbox line cards
│       │       └── add_edit_item_dialog.dart     # Input form modal with live validations
│       └── providers/
├── shared/
└── main.dart                                     # Hive bootstrapper, ProviderScope wrapper & entry point
```

---

## 🔧 Installation & Build Instructions

Follow these steps to run the Flutter client app locally:

### 1. Prerequisites
- Ensure the **Flutter SDK** is installed (`stable` branch, version >= 3.0.0 is recommended).
- Ensure a simulator (iOS) or emulator (Android) is active, or a physical phone is plugged in.

### 2. Clone and Setup
```bash
# Navigate to project root containing pubspec.yaml
cd grocery_expense_tracker

# Get all dependencies
flutter pub get
```

### 3. Generate Adaptors (Optional)
The project comes with a pre-assembled file `grocery_item.g.dart` to let you compile the code immediately without prior build execution. If you modify any model properties, regenerate adapters by executing:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### 4. Running the App
```bash
# Run in debug mode on your active device
flutter run
```

### 5. Packaging Production Builds
```bash
# Compile release APK for Android
flutter build apk --release

# Compile App Store container for iOS
flutter build ipa --release
```

---

## 📦 Core Libraries
- **flutter_riverpod**: Absolute separation of presentation, data filtering states, and calculations.
- **hive_flutter**: Blazing fast, lightweight, NoSQL local database layer that persists key-value properties.
- **uuid**: Generates non-conflicting unique identity keys.
- **intl**: Provides currency formatting and clock timestamp string mapping.
