import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";
// import * as ScreenOrientation from 'expo-screen-orientation';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { RaceProvider } from './RaceContext';

import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import Races from './screens/Races';
import Finishers from './screens/Finishers';
import Participants from "./screens/Participants";
import FinishersEdit from "./screens/FinishersEdit";
import RacesPast from "./screens/RacesPast";

const Stack = createNativeStackNavigator();

export default function App() {
  // useEffect(() => {
  //   if (Platform.OS === 'android') {
  //     // set soft input mode safely on Android
  //     SystemUI.setSoftInputModeAsync(SystemUI.SoftInputMode.RESIZE)
  //       .catch((err) => console.log("setSoftInputModeAsync error:", err));
  //   }
  // }, []);

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

                    {/* Races screen — shows list of races and a few links */}
                    <Stack.Screen name="RacesPast" component={RacesPast} />

                    {/* Race screen — shows stopwatch, finishers, etc. */}
                    <Stack.Screen name="Finishers" component={Finishers} />

                    {/* Deleted finishers screen */}
                    <Stack.Screen name="Participants" component={Participants} />

                    {/* Deleted finishers screen */}
                    <Stack.Screen name="FinishersEdit" component={FinishersEdit} />

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
