import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../theme';
import LetterSheet from './LetterSheet';

const BOT_URL = 'https://B2n.ir/md3187';

export default function StartGateCard({ reason }) {
  return (
    <LetterSheet stamp={'ورود\nنامه'}>
      <Text style={styles.emoji}>💌</Text>
      <Text style={styles.title}>برای باز کردن نامه، لینک اختصاصی لازم است</Text>
      <Text style={styles.body}>
        {reason === 'burned'
          ? 'این نامه باطل شده؛ صاحب دعوت نامهٔ جدید ساخته. ازش بخواه لینک تازه بفرسته.'
          : reason === 'invalid'
            ? 'این نامه معتبر نیست یا منقضی شده. صاحب دعوت باید از ربات نامهٔ جدید بگیره.'
            : 'اول برو تو ربات، /start بزن و لینک شخصی خودت رو بگیر، بعد همون لینک رو برای طرف مقابل بفرست.'}
      </Text>
      <Pressable onPress={() => Linking.openURL(BOT_URL)} style={styles.btn}>
        <Text style={styles.btnText}>ورود به ربات و گرفتن نامه 💌</Text>
      </Pressable>
      <Text style={styles.foot}>از لینک کوتاه B2n وارد ربات شو، بعد /start بزن</Text>
    </LetterSheet>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 44, textAlign: 'center', marginBottom: spacing.sm },
  title: {
    fontFamily: fonts.body,
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.lg,
  },
  btn: {
    backgroundColor: colors.wax,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  btnText: {
    fontFamily: fonts.body,
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  foot: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
