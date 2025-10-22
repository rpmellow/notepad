import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
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

// Theme Context
const ThemeContext = createContext();

function uid() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

// Theme definitions with improved contrast
const themes = {
  light: {
    bg: '#FFF7FB',
    card: '#FFFFFF',
    cardBorder: '#E0E0E0',
    pink: '#FFD9E8',
    mint: '#E6FFF4',
    lilac: '#F3E8FF',
    textPrimary: '#4a2b4a',
    textSecondary: '#5b3b5b',
    textTertiary: '#9b7b9b',
    textHeader: '#6b2d6b',
    fab: '#ff6fa3',
    fabText: '#fff',
    inputBg: '#fff',
    shadow: '#6b2d6b',
    placeholder: '#9e9e9e',
    modalSave: '#ff6fa3',
  },
  dark: {
    bg: '#1A1A1A', // Darker background for better contrast
    card: '#2E2E2E', // Lighter card color for distinction
    cardBorder: '#4A4A4A', // Subtle border for card separation
    pink: '#F06292',
    mint: '#26A69A',
    lilac: '#9575CD',
    textPrimary: '#E0E0E0',
    textSecondary: '#B0B0B0',
    textTertiary: '#757575',
    textHeader: '#F5F5F5',
    fab: '#F06292',
    fabText: '#FFF',
    inputBg: '#333333',
    shadow: '#000000',
    placeholder: '#757575',
    modalSave: '#F06292',
  },
};

export default function App() {
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [theme, setTheme] = useState('light');
  const titleRef = useRef(null);

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
      if (raw) setNotes(JSON.parse(raw));
    } catch (e) {
      console.warn('Failed loading notes', e);
    }
  };

  const saveNotes = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn('Failed saving notes', e);
    }
  };

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && themes[savedTheme]) {
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
    setEditingNote({ id: null, title: '', body: '', pinned: false });
    setModalVisible(true);
    setTimeout(() => titleRef.current && titleRef.current.focus(), 300);
  };

  const openEditNote = (note) => {
    setEditingNote({ ...note });
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

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (editingNote.id) {
      setNotes((prev) =>
        prev.map((n) => (n.id === editingNote.id ? { ...n, title: t, body: b, updatedAt: Date.now() } : n))
      );
    } else {
      const newNote = {
        id: uid(),
        title: t,
        body: b,
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNotes((prev) => [newNote, ...prev]);
    }
    setModalVisible(false);
  };

  const togglePin = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const confirmDelete = (id) => {
    Alert.alert('Delete note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteNote(id),
      },
    ]);
  };

  const deleteNote = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = notes
    .filter((n) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (n.title || '').toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q);
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
            <TouchableOpacity onPress={() => togglePin(item.id)} style={styles.actionBtn}>
              <Text style={styles.actionEmoji}>{item.pinned ? '📌' : '📍'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.actionBtn}>
              <Text style={styles.actionEmoji}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.cardBody} numberOfLines={3}>
          {item.body || 'No content yet. Tap to edit.'}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>
            {new Date(item.updatedAt || item.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: themes[theme] }}>
      <ThemeWrapper>
        <SafeAreaView style={styles.container}>
          <StatusBar
            barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
            backgroundColor="transparent"
            translucent
          />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🌸 Cute Notepad</Text>
            <View style={styles.headerRow}>
              <TextInput
                placeholder="Search notes..."
                placeholderTextColor={themes[theme].placeholder}
                style={styles.search}
                value={query}
                onChangeText={setQuery}
              />
              <ThemeToggle />
            </View>
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
                  placeholderTextColor={themes[theme].placeholder}
                  style={styles.inputTitle}
                  value={editingNote ? editingNote.title : ''}
                  onChangeText={(t) => setEditingNote((s) => ({ ...s, title: t }))}
                  returnKeyType="next"
                />
                <TextInput
                  placeholder="Write something cute..."
                  placeholderTextColor={themes[theme].placeholder}
                  style={styles.inputBody}
                  value={editingNote ? editingNote.body : ''}
                  onChangeText={(t) => setEditingNote((s) => ({ ...s, body: t }))}
                  multiline
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
      </ThemeWrapper>
    </ThemeContext.Provider>
  );
}

// ThemeWrapper to apply dynamic styles
function ThemeWrapper({ children }) {
  const { colors } = useContext(ThemeContext);
  return <View style={[styles.container, { backgroundColor: colors.bg }]}>{children}</View>;
}

// ThemeToggle component
function ThemeToggle() {
  const { theme, toggleTheme, colors } = useContext(ThemeContext);
  return (
    <View style={styles.themeToggle}>
      <Text style={[styles.themeLabel, { color: colors.textSecondary }]}>
        {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
      </Text>
      <Switch
        value={theme === 'dark'}
        onValueChange={toggleTheme}
        trackColor={{ false: colors.placeholder, true: colors.pink }}
        thumbColor={colors.fab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 8,
    color: (props) => props.theme.colors.textHeader,
  },
  search: {
    flex: 1,
    backgroundColor: (props) => props.theme.colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    shadowColor: (props) => props.theme.colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    color: (props) => props.theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: (props) => props.theme.colors.cardBorder,
  },
  themeToggle: {
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 10,
  },
  card: {
    backgroundColor: (props) => props.theme.colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: (props) => props.theme.colors.shadow,
    shadowOpacity: 0.1, // Increased for better visibility
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 5, // Increased for more pronounced elevation
    borderWidth: 1,
    borderColor: (props) => props.theme.colors.cardBorder,
  },
  cardPinned: {
    borderWidth: 2,
    borderColor: (props) => props.theme.colors.pink,
    backgroundColor: (props) => props.theme.colors.mint, // Changed to mint for better contrast
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: (props) => props.theme.colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 6,
    marginLeft: 6,
    borderRadius: 8,
  },
  actionEmoji: {
    fontSize: 18,
  },
  cardBody: {
    marginTop: 8,
    fontSize: 14,
    color: (props) => props.theme.colors.textSecondary,
  },
  cardFooter: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 11,
    color: (props) => props.theme.colors.textTertiary,
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
    fontSize: 16,
    color: (props) => props.theme.colors.textTertiary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 34,
    backgroundColor: (props) => props.theme.colors.fab,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: (props) => props.theme.colors.fab,
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  fabText: {
    color: (props) => props.theme.colors.fabText,
    fontSize: 34,
    lineHeight: 36,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: (props) => props.theme.colors.bg,
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
    color: (props) => props.theme.colors.textHeader,
  },
  modalTitle: {
    fontSize: 18,
    color: (props) => props.theme.colors.textHeader,
    fontWeight: '700',
  },
  modalSave: {
    fontSize: 16,
    color: (props) => props.theme.colors.modalSave,
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputTitle: {
    backgroundColor: (props) => props.theme.colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    shadowColor: (props) => props.theme.colors.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    color: (props) => props.theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: (props) => props.theme.colors.cardBorder,
  },
  inputBody: {
    backgroundColor: (props) => props.theme.colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 160,
    textAlignVertical: 'top',
    shadowColor: (props) => props.theme.colors.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    color: (props) => props.theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: (props) => props.theme.colors.cardBorder,
  },
  pinRow: {
    marginTop: 12,
    flexDirection: 'row',
  },
  pinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: (props) => props.theme.colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: (props) => props.theme.colors.shadow,
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: (props) => props.theme.colors.cardBorder,
  },
  pinEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  pinText: {
    fontSize: 14,
    color: (props) => props.theme.colors.textHeader,
    fontWeight: '600',
  },
});

// Apply styles dynamically with ThemeContext
const dynamicStyles = (theme) =>
  StyleSheet.create(
    Object.keys(styles).reduce((acc, key) => {
      const style = styles[key];
      acc[key] = typeof style === 'function' ? style({ theme }) : style;
      return acc;
    }, {})
  );

export { dynamicStyles };
