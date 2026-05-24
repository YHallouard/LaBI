# Migrating from Tabs to NativeTabs
If you created your Expo app using the default template, your current layout probably looks something like this:

```typescript
import { Tabs } from 'expo-router';
import React from 'react';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
```

To migrate, import NativeTabs from:

```typescript
import { NativeTabs } from "expo-router/unstable-native-tabs";
```

Then replace:

Tabs → NativeTabs
Tabs.Screen → NativeTabs.Trigger
options → (Label, Icon, Badge) as NativeTabs.Trigger children
Here’s an example:

```typescript
import { useTheme } from "@react-navigation/native";
import {
  Badge,
  Icon,
  Label,
  NativeTabs,
} from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  const theme = useTheme();
  return (
    <NativeTabs
    // tintColor={theme.colors.primary}
    // backgroundColor={theme.colors.background}
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon
          sf="house.fill"
          androidSrc={require("../../../assets/android/home_24dp.png")}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chats">
        <Label>Chats</Label>
        <Badge>9+</Badge>
        <Icon
          sf="bubble"
          androidSrc={require("../../../assets/android/chat_24dp.png")}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search" role="search">
        <Label>Search</Label>
        <Icon
          sf="magnifyingglass"
          androidSrc={require("../../../assets/android/search_24dp.png")}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Icon
          sf="gear"
          androidSrc={require("../../../assets/android/settings_24dp.png")}
        />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

And that’s it, now you have a fully native tab bar.

# Adding a Native SearchBar in the Tab
We can get more features, like this one, add a system-level search bar.

To enable it, assign the role=”search” to your trigger:

```typescript
<NativeTabs.Trigger name="search" role="search">
  <Label>Search</Label>
  <Icon
    sf="magnifyingglass"
    androidSrc={require("../../../assets/android/search_24dp.png")}
  />
</NativeTabs.Trigger>
```

However, there’s an important detail:

The search bar is injected into the native header. That means you must keep the header enabled for that screen.

In your search screen:

```typescript
import { Stack } from "expo-router";
import { useState } from "react";
import { ScrollView, Text } from "react-native";

export default function SearchIndex() {
  const [searchText, setSearchText] = useState("");
  return (
    <>
      <Stack.Screen
        options={{
          title: "Search",
          headerSearchBarOptions: {
            placeholder: "Search",
            onChangeText: (event) => {
              setSearchText(event.nativeEvent.text);
            },
          },
        }}
      />
      <ScrollView>
        <Text>{searchText}</Text>
      </ScrollView>
    </>
  );
}

```

And we’ll also need to define a simple layout:

```typescript
import { Stack } from "expo-router";

export default function SearchLayout() {
  return <Stack />;
}
```

This keeps navigation clean while allowing the OS to manage the search UI natively.

Tip: NativeTabs includes other features that can help you unlock more potential in your app, like badges, role-based triggers, and native animations. Check the official documentation for all available options.

When Should You Use NativeTabs?
Use it if:

You want platform-authentic UI
You prefer system-driven design updates
You don’t need deep custom tab bar animations
You value long-term maintainability
Avoid it if:

You require a heavily customized tab bar
You need complex animated interactions beyond system capabilities
Final Thoughts
NativeTabs is a small architectural change with a big UX impact.

Your app:

Automatically adopts Liquid Glass on iOS 26
Preserves native behavior on older iOS versions
Adapts to Material 3 on Android
Removes the need for custom cross-platform styling
In modern Expo projects, this should be the default choice unless you have a strong reason not to use it.

Documentation & Resources
Expo Router Docs — Native Tabs
https://docs.expo.dev/router/advanced/native-tabs/
Expo Router Docs — Native Tabs API
https://docs.expo.dev/versions/latest/sdk/router-native-tabs/