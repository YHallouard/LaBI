import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from "react-native";
import { colorPalette, glass } from "../../config/themes";
import { Ionicons } from "@expo/vector-icons";
import { LAB_VALUE_KEYS } from "../../config/LabConfig";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SearchBar } from "./SearchBar";

interface PinnedItemsModalProps {
  isVisible: boolean;
  onClose: () => void;
  pinnedItems: string[];
  onSave: (pinnedItems: string[]) => void;
}

export const PinnedItemsModal: React.FC<PinnedItemsModalProps> = ({
  isVisible,
  onClose,
  pinnedItems: initialPinnedItems,
  onSave,
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLabKeys = useMemo(() => {
    if (!searchQuery) return LAB_VALUE_KEYS;
    const q = searchQuery.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return LAB_VALUE_KEYS.filter((key) =>
      key.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q)
    );
  }, [searchQuery]);

  useEffect(() => {
    setSelectedItems(initialPinnedItems);
  }, [initialPinnedItems]);

  const toggleItem = (item: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(item)) {
        // Always allow un-selecting
        return prev.filter((i) => i !== item);
      }
      // Allow selecting only if the limit is not reached
      if (prev.length < 3) {
        return [...prev, item];
      }
      // Limit reached, do not add the item
      return prev;
    });
  };

  const handleSave = () => {
    onSave(selectedItems);
  };

  const renderItem = ({ item }: { item: string }) => {
    const isSelected = selectedItems.includes(item);
    const limitReached = !isSelected && selectedItems.length >= 3;

    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          onPress={() => toggleItem(item)}
          style={styles.item}
          disabled={limitReached}
        >
          <Ionicons
            name={isSelected ? "checkbox" : "square-outline"}
            size={24}
            color={
              isSelected
                ? colorPalette.primary.main
                : limitReached
                ? colorPalette.neutral.lighter
                : colorPalette.neutral.light
            }
          />
          <Text
            style={[
              styles.itemText,
              limitReached && { color: colorPalette.neutral.lighter },
            ]}
          >
            {item}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSelectedItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<string>) => {
    return (
      <TouchableOpacity
        style={[
          styles.selectedItemContainer,
          {
            backgroundColor: isActive
              ? colorPalette.primary.light
              : colorPalette.neutral.lighter,
          },
        ]}
        onLongPress={drag}
      >
        <Text style={styles.selectedItemText}>{item}</Text>
        <Ionicons
          name="reorder-three"
          size={28}
          color={colorPalette.neutral.dark}
        />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="formSheet"
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Épingler des métriques</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={30}
                color={colorPalette.neutral.dark}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Métriques sélectionnées</Text>
            <DraggableFlatList
              data={selectedItems}
              renderItem={renderSelectedItem}
              keyExtractor={(item) => `selected-${item}`}
              onDragEnd={({ data }) => setSelectedItems(data)}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Toutes les métriques</Text>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Filtrer les métriques..."
              style={styles.searchBar}
            />
            <FlatList
              data={filteredLabKeys}
              renderItem={renderItem}
              keyExtractor={(item) => item}
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colorPalette.neutral.white,
    borderTopLeftRadius: glass.radii.lg,
    borderTopRightRadius: glass.radii.lg,
    overflow: "hidden",
  },
  searchBar: {
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colorPalette.neutral.lighter,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colorPalette.neutral.dark,
  },
  listContainer: {
    paddingHorizontal: 15,
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colorPalette.neutral.dark,
    marginVertical: 15,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemText: {
    marginLeft: 15,
    fontSize: 16,
    color: colorPalette.neutral.dark,
  },
  moveButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  separator: {
    height: 1,
    backgroundColor: colorPalette.neutral.lighter,
    marginVertical: 10,
  },
  selectedItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: colorPalette.neutral.lighter,
    borderRadius: 8,
    marginBottom: 5,
  },
  selectedItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: colorPalette.neutral.dark,
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: colorPalette.neutral.lighter,
  },
  saveButton: {
    backgroundColor: colorPalette.primary.main,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: colorPalette.neutral.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});
