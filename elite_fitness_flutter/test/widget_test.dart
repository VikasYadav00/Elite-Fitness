import 'package:flutter_test/flutter_test.dart';
import 'package:elite_fitness/app.dart';

void main() {
  testWidgets('Elite Fitness App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const EliteFitnessApp());
    await tester.pump(const Duration(seconds: 3));
    expect(find.byType(EliteFitnessApp), findsOneWidget);
  });
}
