import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule} from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import { NgJsonEditorModule } from 'ang-jsoneditor';

import {AppComponent} from './app.component';
import {CmD3GraphsModule} from 'cm-d3-graphs';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    NgJsonEditorModule,
    CmD3GraphsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
