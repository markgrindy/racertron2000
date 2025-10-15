import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { RaceProvider } from './RaceContext';
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, StyleSheet } from "react-native";

import Races from './screens/Races';
import Finishers from './screens/Finishers';
import FinishersDeleted from "./screens/FinishersDeleted";
import ResultsArchived from "./screens/ResultsArchived";
import Results from "./screens/Results";
import { useNavigation } from "@react-navigation/native";

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

                  {/* Races screen — shows list of races and a few links */}
                  <Stack.Screen name="Races" component={Races} />

                  {/* Past results - shows completed races */}
                  <Stack.Screen name="All Results" component={Results} />

                  {/* Race screen — shows stopwatch, finishers, etc. */}
                  <Stack.Screen name="Finishers" component={Finishers} />

                  {/* Deleted finishers screen */}
                  <Stack.Screen
                    name="FinishersDeleted"
                    component={FinishersDeleted}
                    options={{ title: "Deleted Times" }}
                  />

                  <Stack.Screen name="ResultsArchived" component={ResultsArchived} />

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
