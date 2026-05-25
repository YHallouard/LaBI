import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Toggle } from './Toggle';

interface Props {
  active: boolean;
  onToggle: (v: boolean) => void;
  deviceName: string;
}

export function SyncHeroCard({ active, onToggle, deviceName }: Props) {
  return (
    <LinearGradient
      colors={active ? ['#2C7BE5', '#1F66C9'] : ['#95AAC9', '#6E8AB1']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {active && <PulseDecor />}

      {/* Status row */}
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <View style={[styles.dot, active ? styles.dotActive : styles.dotInactive]} />
          <Text style={styles.statusText}>
            {active ? 'Synchronisation active' : 'Synchronisation désactivée'}
          </Text>
        </View>
        <Toggle value={active} onChange={onToggle} />
      </View>

      {/* Device identity */}
      <Text style={styles.deviceLabel}>CET APPAREIL</Text>
      <Text style={styles.deviceName}>{deviceName}</Text>
    </LinearGradient>
  );
}

function PulseDecor() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.18, 0.32, 0.18] });

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { opacity }]} pointerEvents="none">
      <View style={pulse.ring1} />
      <View style={pulse.ring2} />
      <View style={pulse.ring3} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
    overflow: 'hidden',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    position: 'relative',
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: '#6DD39A', shadowColor: '#6DD39A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 4 },
  dotInactive: { backgroundColor: 'rgba(255,255,255,.4)' },
  statusText: { fontSize: 13, fontWeight: '600', color: '#fff', letterSpacing: 0.2 },
  deviceLabel: { fontSize: 11, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', marginBottom: 4 },
  deviceName: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
});

const pulse = StyleSheet.create({
  ring1: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.18)' },
  ring2: { position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: 40, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.22)' },
  ring3: { position: 'absolute', top: 10, right: 10, width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.30)' },
});
