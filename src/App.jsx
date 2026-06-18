import { Navigate, Routes, Route } from 'react-router-dom';
import MobileShell from '@/layout/MobileShell';
import CloudSync from '@/components/CloudSync';
import AppInit from '@/components/AppInit';
import StoreHydrationGate from '@/components/StoreHydrationGate';
import { useNutritionStore } from '@/store/useNutritionStore';
import OnboardingPage from '@/pages/OnboardingPage';
import DashboardPage from '@/pages/DashboardPage';
import FoodLogPage from '@/pages/FoodLogPage';
import SearchPage from '@/pages/SearchPage';
import ScanHubPage from '@/pages/ScanHubPage';
import ScanPage from '@/pages/ScanPage';
import RecipesPage from '@/pages/RecipesPage';
import MyProductsPage from '@/pages/MyProductsPage';
import MyMealsPage from '@/pages/MyMealsPage';
import MyFoodsPage from '@/pages/MyFoodsPage';
import SearchIngredientPage from '@/pages/SearchIngredientPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import ProfilePage from '@/pages/ProfilePage';
import FoodDetailPage from '@/pages/FoodDetailPage';

function RequireOnboarding({ children }) {
  const done = useNutritionStore((s) => s.onboardingComplete);
  if (!done) return <Navigate to="/onboarding" replace />;
  return children;
}

export default function App() {
  return (
    <StoreHydrationGate>
      <AppInit />
      <CloudSync />
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/scanner" element={<RequireOnboarding><ScanPage /></RequireOnboarding>} />
        <Route element={<RequireOnboarding><MobileShell /></RequireOnboarding>}>
          <Route index element={<DashboardPage />} />
          <Route path="log" element={<FoodLogPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="scan" element={<ScanHubPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="ingredients" element={<SearchIngredientPage />} />
          <Route path="describe-meal" element={<Navigate to="/log" replace />} />
          <Route path="products" element={<MyProductsPage />} />
          <Route path="meals" element={<MyMealsPage />} />
          <Route path="my-foods" element={<MyFoodsPage />} />
          <Route path="recipes" element={<RecipesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="food/:entryId" element={<FoodDetailPage />} />
          <Route path="add" element={<Navigate to="/scan" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StoreHydrationGate>
  );
}
