import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';

const BOT_URL = 'https://B2n.ir/md3187'; // short entry → must redirect to t.me/Meetingir_mir_bot

export default function StartGateCard({ reason }) {
  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>💌</Text>
      <Text style={styles.title}>برای شروع، لینک اختصاصی لازم است</Text>
      <Text style={styles.body}>
        {reason === 'burned'
          ? 'این لینک سوخته؛ صاحب دعوت لینک جدید ساخته. ازش بخواه لینک تازه بفرسته.'
          : reason === 'invalid'
            ? 'این لینک معتبر نیست یا منقضی شده. صاحب دعوت باید از ربات لینک جدید بگیره.'
            : 'هر نفر اول باید بره تو ربات، دستور /start بزنه و لینک شخصی خودش رو بگیره، بعد همون لینک رو برای طرف مقابل بفرسته.'}
      </Text>
      <Pressable onPress={() => Linking.openURL(BOT_URL)} style={styles.btn}>
        <Text style={styles.btnText}>ورود به ربات و گرفتن لینک 💌</Text>
      </Pressable>
      <Text style={styles.foot}>از لینک کوتاه B2n وارد ربات شو، بعد /start بزن 💕</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#E91E63',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  foot: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
