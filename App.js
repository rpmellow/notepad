import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  StatusBar,
  Platform,
  UIManager,
  LayoutAnimation,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STORAGE_KEY = '@cute_notepad_notes_v1';
const THEME_STORAGE_KEY = '@cute_notepad_theme_v1';

function uid() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

// Function to get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
};

// Light theme styles (unchanged)
const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7FB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6b2d6b',
    marginBottom: 8,
  },
  search: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    shadowColor: '#6b2d6b',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    color: '#4a2b4a',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  themeToggle: {
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 14,
    marginRight: 8,
    color: '#5b3b5b',
  },
  tagsContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  tagButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tagButtonSelected: {
    backgroundColor: '#FFD9E8',
    borderColor: '#ff6fa3',
  },
  tagText: {
    fontSize: 14,
    color: '#4a2b4a',
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#6b2d6b',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#6b2d6b',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardPinned: {
    borderWidth: 2,
    borderColor: '#FFD9E8',
    backgroundColor: '#E6FFF4',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4a2b4a',
    flex: 1,
    marginRight: 8,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 6,
    borderRadius: 8,
  },
  actionEmoji: {
    fontSize: 18,
  },
  cardBody: {
    marginTop: 8,
    fontSize: 14,
    color: '#5b3b5b',
  },
  cardTags: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardTag: {
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  cardTagText: {
    fontSize: 12,
    color: '#6b2d6b',
  },
  cardFooter: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 11,
    color: '#9b7b9b',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#9b7b9b',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 34,
    backgroundColor: '#ff6fa3',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#ff6fa3',
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  fabText: {
    color: '#fff',
    fontSize: 34,
    lineHeight: 36,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF7FB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  modalClose: {
    fontSize: 22,
    color: '#6b2d6b',
  },
  modalTitle: {
    fontSize: 18,
    color: '#6b2d6b',
    fontWeight: '700',
  },
  modalSave: {
    fontSize: 16,
    color: '#ff6fa3',
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputTitle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    shadowColor: '#6b2d6b',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    color: '#4a2b4a',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputBody: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 160,
    textAlignVertical: 'top',
    shadowColor: '#6b2d6b',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    color: '#4a2b4a',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputTags: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    shadowColor: '#6b2d6b',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    color: '#4a2b4a',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 40,
  },
  pinRow: {
    marginTop: 12,
    flexDirection: 'row',
  },
  pinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#6b2d6b',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pinEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  pinText: {
    fontSize: 14,
    color: '#6b2d6b',
    fontWeight: '600',
  },
});

// Dark theme styles (unchanged)
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F5F5F5',
    marginBottom: 8,
  },
  search: {
    flex: 1,
    backgroundColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    color: '#E0E0E0',
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  themeToggle: {
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 14,
    marginRight: 8,
    color: '#B0B0B0',
  },
  tagsContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  tagButton: {
    backgroundColor: '#333333',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  tagButtonSelected: {
    backgroundColor: '#F06292',
    borderColor: '#F06292',
  },
  tagText: {
    fontSize: 14,
    color: '#E0E0E0',
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 10,
  },
  card: {
    backgroundColor: '#2E2E2E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  cardPinned: {
    borderWidth: 2,
    borderColor: '#F06292',
    backgroundColor: '#26A69A',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E0E0E0',
    flex: 1,
    marginRight: 8,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 6,
    borderRadius: 8,
  },
  actionEmoji: {
    fontSize: 18,
  },
  cardBody: {
    marginTop: 8,
    fontSize: 14,
    color: '#B0B0B0',
  },
  cardTags: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardTag: {
    backgroundColor: '#9575CD',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  cardTagText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  cardFooter: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 11,
    color: '#757575',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#757575',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 34,
    backgroundColor: '#F06292',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#F06292',
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  fabText: {
    color: '#FFF',
    fontSize: 34,
    lineHeight: 36,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  modalClose: {
    fontSize: 22,
    color: '#F5F5F5',
  },
  modalTitle: {
    fontSize: 18,
    color: '#F5F5F5',
    fontWeight: '700',
  },
  modalSave: {
    fontSize: 16,
    color: '#F06292',
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputTitle: {
    backgroundColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    color: '#E0E0E0',
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  inputBody: {
    backgroundColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 160,
    textAlignVertical: 'top',
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    color: '#E0E0E0',
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  inputTags: {
    backgroundColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    color: '#E0E0E0',
    borderWidth: 1,
    borderColor: '#4A4A4A',
    minHeight: 40,
  },
  pinRow: {
    marginTop: 12,
    flexDirection: 'row',
  },
  pinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  pinEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  pinText: {
    fontSize: 14,
    color: '#F5F5F5',
    fontWeight: '600',
  },
});

export default function App() {
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [theme, setTheme] = useState('light');
  const titleRef = useRef(null);

  // Select styles based on theme
  const styles = theme === 'light' ? lightStyles : darkStyles;
  const placeholderColor = theme === 'light' ? '#9e9e9e' : '#757575';
  const switchTrackColor = {
    false: theme === 'light' ? '#9e9e9e' : '#757575',
    true: theme === 'light' ? '#FFD9E8' : '#F06292',
  };
  const switchThumbColor = theme === 'light' ? '#ff6fa3' : '#F06292';

  useEffect(() => {
    loadNotes();
    loadTheme();
  }, []);

  useEffect(() => {
    saveNotes();
  }, [notes]);

  useEffect(() => {
    saveTheme();
  }, [theme]);

  const loadNotes = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        // Ensure tags are uppercase when loading from storage
        const loadedNotes = JSON.parse(raw).map((note) => ({
          ...note,
          tags: note.tags ? note.tags.map((tag) => tag.toUpperCase()) : [],
        }));
        setNotes(loadedNotes);
      }
    } catch (e) {
      console.warn('Failed loading notes', e);
      Alert.alert('Error', 'Failed to load notes. Please try again.');
    }
  };

  const saveNotes = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn('Failed saving notes', e);
      Alert.alert('Error', 'Failed to save notes. Please try again.');
    }
  };

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
        setTheme(savedTheme);
      }
    } catch (e) {
      console.warn('Failed loading theme', e);
    }
  };

  const saveTheme = async () => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Failed saving theme', e);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const openNewNote = () => {
    setEditingNote({ id: null, title: '', body: '', tags: [], tagsInput: '', pinned: false });
    setModalVisible(true);
    setTimeout(() => titleRef.current && titleRef.current.focus(), 300);
  };

  const openEditNote = (note) => {
    setEditingNote({
      ...note,
      tags: note.tags || [],
      tagsInput: (note.tags || []).join(', '),
    });
    setModalVisible(true);
    setTimeout(() => titleRef.current && titleRef.current.focus(), 300);
  };

  const saveEditing = () => {
    const t = (editingNote.title || '').trim();
    const b = (editingNote.body || '').trim();
    if (!t && !b) {
      setModalVisible(false);
      return;
    }

    // Convert tags to uppercase
    const tags = (editingNote.tagsInput || '')
      .split(',')
      .map((tag) => tag.trim().toUpperCase())
      .filter((tag) => tag.length > 0);

    console.log('Saving note with tags:', tags);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (editingNote.id) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id
            ? { ...n, title: t, body: b, tags, updatedAt: Date.now() }
            : n
        )
      );
    } else {
      const newNote = {
        id: uid(),
        title: t,
        body: b,
        tags,
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNotes((prev) => [newNote, ...prev]);
    }
    setModalVisible(false);
  };

  const togglePin = (id) => {
    console.log('Toggling pin for id:', id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const confirmDelete = (id) => {
    console.log('confirmDelete called with id:', id);
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('Delete pressed for id:', id);
            deleteNote(id);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const deleteNote = (id) => {
    console.log('deleteNote called with id:', id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotes((prev) => {
      const updatedNotes = prev.filter((n) => n.id !== id);
      console.log('Updated notes:', updatedNotes);
      return updatedNotes;
    });
  };

  // Get unique tags from notes, ensuring uppercase
  const getTags = () => {
    const allTags = notes.reduce((acc, note) => {
      if (note.tags && note.tags.length > 0) {
        note.tags.forEach((tag) => {
          const upperTag = tag.toUpperCase();
          if (!acc.includes(upperTag)) {
            acc.push(upperTag);
          }
        });
      }
      return acc;
    }, []);
    return ['ALL', ...allTags.sort()];
  };

  const tags = getTags();

  const filtered = notes
    .filter((n) => {
      // Apply tag filter
      if (selectedTag !== 'ALL' && (!n.tags || !n.tags.includes(selectedTag))) {
        return false;
      }
      // Apply search query filter
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (n.title || '').toLowerCase().includes(q) ||
        (n.body || '').toLowerCase().includes(q) ||
        (n.tags || []).some((tag) => tag.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });

  const renderItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.9} onPress={() => openEditNote(item)}>
      <View style={[styles.card, item.pinned ? styles.cardPinned : null]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title || 'Untitled'}
          </Text>
          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() => togglePin(item.id)}
              style={styles.actionBtn}
              testID={`pin-button-${item.id}`}
            >
              <Text style={styles.actionEmoji}>{item.pinned ? '📌' : '📍'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                confirmDelete(item.id);
              }}
              style={styles.actionBtn}
              testID={`delete-button-${item.id}`}
            >
              <Text style={styles.actionEmoji}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.cardBody} numberOfLines={3}>
          {item.body || 'No content yet. Tap to edit.'}
        </Text>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.cardTags}>
            {item.tags.map((tag, index) => (
              <View key={index} style={styles.cardTag}>
                <Text style={styles.cardTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>
            {new Date(item.updatedAt || item.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTag = ({ item }) => (
    <TouchableOpacity
      style={[styles.tagButton, selectedTag === item ? styles.tagButtonSelected : null]}
      onPress={() => setSelectedTag(item)}
    >
      <Text style={[styles.tagText, selectedTag === item ? styles.tagTextSelected : null]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌸 {getGreeting()}</Text>
        <View style={styles.headerRow}>
          <TextInput
            placeholder="Search notes..."
            placeholderTextColor={placeholderColor}
            style={styles.search}
            value={query}
            onChangeText={setQuery}
          />
          <View style={styles.themeToggle}>
            <Text style={styles.themeLabel}>{theme === 'light' ? '☀️ Light' : '🌙 Dark'}</Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={switchTrackColor}
              thumbColor={switchThumbColor}
            />
          </View>
        </View>
        <FlatList
          data={tags}
          renderItem={renderTag}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsContainer}
          ListEmptyComponent={<Text style={styles.tagText}>No tags yet</Text>}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>No notes yet — tap + to add one!</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openNewNote}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      <Modal animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingNote && editingNote.id ? 'Edit Note' : 'New Note'}</Text>
            <TouchableOpacity onPress={saveEditing}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <TextInput
              ref={titleRef}
              placeholder="Title"
              placeholderTextColor={placeholderColor}
              style={styles.inputTitle}
              value={editingNote ? editingNote.title : ''}
              onChangeText={(t) => setEditingNote((s) => ({ ...s, title: t }))}
              returnKeyType="next"
            />
            <TextInput
              placeholder="Write something cute..."
              placeholderTextColor={placeholderColor}
              style={styles.inputBody}
              value={editingNote ? editingNote.body : ''}
              onChangeText={(t) => setEditingNote((s) => ({ ...s, body: t }))}
              multiline
              returnKeyType="next"
            />
            <TextInput
              placeholder="Tags (comma-separated, e.g., WORK, PERSONAL)"
              placeholderTextColor={placeholderColor}
              style={styles.inputTags}
              value={editingNote ? editingNote.tagsInput : ''}
              onChangeText={(t) => {
                console.log('Tags input changed:', t);
                setEditingNote((s) => ({ ...s, tagsInput: t }));
              }}
              returnKeyType="done"
            />
            <View style={styles.pinRow}>
              <TouchableOpacity
                onPress={() => setEditingNote((s) => ({ ...s, pinned: !s.pinned }))}
                style={styles.pinBtn}
              >
                <Text style={styles.pinEmoji}>{editingNote && editingNote.pinned ? '📌' : '📍'}</Text>
                <Text style={styles.pinText}>{editingNote && editingNote.pinned ? 'Pinned' : 'Pin'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
