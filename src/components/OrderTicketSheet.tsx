import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, spacing, typography } from "../theme";
import { decimalToImpliedProb, formatPct } from "../utils/odds";
import {
  formatCurrency,
  sanitizeStake,
  sanitizeStakeInput,
} from "../utils/order";
import { SegmentedYesNo } from "./SegmentedYesNo";

type OrderTicketSheetProps = {
  visible: boolean;
  onClose: () => void;
  yesDecimalOdds: number;
  noDecimalOdds: number;
};

export const OrderTicketSheet = ({
  visible,
  onClose,
  yesDecimalOdds,
  noDecimalOdds,
}: OrderTicketSheetProps) => {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [stake, setStake] = useState("");

  const decimalOdds = side === "yes" ? yesDecimalOdds : noDecimalOdds;
  const impliedProb = decimalToImpliedProb(decimalOdds);
  const trimmedStake = stake.trim();
  const numericStake = Number(trimmedStake);
  const stakeValid =
    trimmedStake.length > 0 && Number.isFinite(numericStake) && numericStake > 0;
  const payout = stakeValid ? numericStake * decimalOdds : 0;

  const errorMessage = useMemo(() => {
    if (!trimmedStake.length) return "Enter a valid stake amount";
    if (!stakeValid) return "Enter a valid stake amount";
    return "";
  }, [stakeValid, trimmedStake]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetContainer}
        >
          <Pressable
            style={styles.sheet}
            onStartShouldSetResponder={() => true}
          >
          <View style={styles.header}>
            <Text style={styles.title}>Order ticket</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>

          <SegmentedYesNo value={side} onChange={setSide} />

          <View style={styles.section}>
            <Text style={styles.label}>Stake</Text>
            <TextInput
              value={stake}
              onChangeText={(value) => setStake(sanitizeStakeInput(value))}
              onBlur={() => setStake(sanitizeStake(stake))}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
            {!!errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Implied probability</Text>
            <Text style={styles.value}>{formatPct(impliedProb)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Estimated payout</Text>
            <Text style={styles.value}>
              {stakeValid ? formatCurrency(payout) : "--"}
            </Text>
          </View>

          <Pressable
            style={[styles.cta, !stakeValid && styles.ctaDisabled]}
            onPress={stakeValid ? onClose : undefined}
            accessibilityRole="button"
            disabled={!stakeValid}
          >
            <Text style={styles.ctaText}>Place order</Text>
          </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    width: "100%",
  },
  sheet: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  close: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  value: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  input: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm,
    color: colors.textPrimary,
  },
  errorText: {
    ...typography.caption,
    color: colors.noRed,
    marginTop: spacing.xs,
  },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.yesGreen,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    ...typography.subtitle,
    color: colors.background,
  },
});
