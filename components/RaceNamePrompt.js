// components/RaceNamePrompt.js
import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function RaceNamePrompt({ visible, onCancel, onSave }) {
  const [input, setInput] = useState("");

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Enter Race Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Race name"
            value={input}
            onChangeText={setInput}
          />
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                if (input.trim()) {
                  onSave(input.trim());
                  setInput("");
                }
              }}
            >
              <Text style={styles.btnText}>Save & Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  box: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelBtn: {
    marginRight: 10,
  },
  saveBtn: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});