import React from 'react';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RaceView from './screens/RaceView';
import DeletedLogsScreen from "./screens/DeletedLogsScreen";

// import NewRace from './screens/NewRace';
import ResultsList from './screens/ResultsList';
// import ResultsDetail from './screens/ResultsDetail';
import { RaceProvider } from './RaceContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RaceProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Stopwatch" component={RaceView} />
            <Stack.Screen
              screenOptions={{ headerShow: true }}
              name="DeletedLogsScreen"
              component={DeletedLogsScreen}
              options={{ title: "Deleted Times" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </RaceProvider>
    </GestureHandlerRootView> 
  );
}
