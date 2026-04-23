import { Routes } from '@angular/router';
import { FeedPageComponent } from './pages/feed-page/feed-page.component';
import { SearchPageComponent } from './pages/search-page/search-page.component';
import { CreatePageComponent } from './pages/create-page/create-page.component';
import { ActivityPageComponent } from './pages/activity-page/activity-page.component';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';

export const routes: Routes = [
	{ path: '', component: FeedPageComponent },
	{ path: 'search', component: SearchPageComponent },
	{ path: 'create', component: CreatePageComponent },
	{ path: 'activity', component: ActivityPageComponent },
	{ path: 'profile', component: ProfilePageComponent },
	{ path: '**', redirectTo: '' }
];
