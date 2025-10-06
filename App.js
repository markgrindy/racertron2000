import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { RaceProvider } from './RaceContext';
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, StyleSheet } from "react-native";

import Home from './screens/Home';
import Finishers from './screens/Finishers';
import DeletedFinishers from "./screens/DeletedFinishers";
import ArchivedRaces from "./screens/ArchivedRaces";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ActionSheetProvider>
          <RaceProvider>
            <SafeAreaView style={styles.safeArea}>
              <StatusBar barStyle="light-content" backgroundColor="#000" />
              <NavigationContainer>
                <Stack.Navigator 
                  screenOptions={{ 
                    headerShown: false, 
                    contentStyle: { backgroundColor: "#000" },
                  }}>

                  {/* Home screen — shows list of races */}
                  <Stack.Screen name="Home" component={Home} />

                  {/* Race screen — shows stopwatch, finishers, etc. */}
                  <Stack.Screen name="Finishers" component={Finishers} />

                  {/* Deleted finishers screen */}
                  <Stack.Screen
                    name="DeletedFinishers"
                    component={DeletedFinishers}
                    options={{ title: "Deleted Times" }}
                  />

                  <Stack.Screen name="ArchivedRaces" component={ArchivedRaces} />

                </Stack.Navigator>
              </NavigationContainer>
            </SafeAreaView>
          </RaceProvider>
        </ActionSheetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView> 
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000", // ✅ ensures dark background extends into safe area
  },
});
