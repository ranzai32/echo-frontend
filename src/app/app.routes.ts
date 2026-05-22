import { Routes } from '@angular/router';
import { FeedPageComponent } from './pages/feed-page/feed-page.component';
import { SearchPageComponent } from './pages/search-page/search-page.component';
import { CreatePageComponent } from './pages/create-page/create-page.component';
import { ActivityPageComponent } from './pages/activity-page/activity-page.component';
import { ProfilePageComponent } from './pages/profile-page/profile-page.component';
import { PostDetailPageComponent } from './pages/post-detail-page/post-detail-page.component';
import { AdminLoginPageComponent } from './pages/admin-login-page/admin-login-page.component';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
	{ path: '', component: FeedPageComponent },
	{ path: 'post/:id', component: PostDetailPageComponent },
	{ path: 'search', component: SearchPageComponent },
	{ path: 'create', component: CreatePageComponent },
	{ path: 'activity', component: ActivityPageComponent },
	{ path: 'profile', component: ProfilePageComponent },
	{ path: 'admin/login', component: AdminLoginPageComponent },
	{ path: 'admin', component: AdminPageComponent, canActivate: [adminGuard] },
	{ path: '**', redirectTo: '' }
];
