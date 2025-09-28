import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StartTimeDemo from './screens/StartTimeDemo';
import NewRace from './screens/NewRace';
import ResultsList from './screens/ResultsList';
import ResultsDetail from './screens/ResultsDetail';
import { RaceProvider } from './RaceContext';

const Tab = createBottomTabNavigator();
const ResultsStack = createNativeStackNavigator();

function ResultsStackScreen() {
  return (
    <ResultsStack.Navigator
      screenOptions={{
        headerBackTitleVisible: false, // optional: hide back button text on iOS
      }}
    >
      <ResultsStack.Screen
        name="ResultsList"
        component={ResultsList}
        options={{ title: 'Race Results' }}
      />
      <ResultsStack.Screen
        name="ResultsDetail"
        component={ResultsDetail}
        options={{ title: 'Race Details' }}
      />
    </ResultsStack.Navigator>
  );
}

export default function App() {
  return (
    <RaceProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false  
          }}
        >
          <Tab.Screen name="Sandbox" component={StartTimeDemo} />
          <Tab.Screen name="Stopwatch" component={NewRace} />
          <Tab.Screen name="Results" component={ResultsStackScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </RaceProvider>
  );
}
