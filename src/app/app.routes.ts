import { Routes } from '@angular/router';
import { StartPageComponent } from './views/start-page/start-page.component';
import { AuthGuard } from './shared/guard/auth.guard';
import { UserProfileComponent } from './views/user-profile/user-profile.component';
import { MainPageComponent } from './views/main-page/main-page.component';


export const routes: Routes = [
    { path: '', component: StartPageComponent, title: 'GChat', canActivate: [AuthGuard] },
    { path: 'chat', component: MainPageComponent, title: 'GChat', canActivate: [AuthGuard] },
    { path: 'profile', component: UserProfileComponent, title: 'Личный профиль', canActivate: [AuthGuard] },
];
