import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing } from './theme';

export default function App() {
  return (
    <LinearGradient colors={[colors.bgStart, colors.bgEnd]} style={styles.root}>
      <Text style={styles.probe}>Date Invite</Text>
      <StatusBar style="dark" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  probe: {
    color: colors.text,
    fontSize: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
