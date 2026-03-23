import { AfterViewInit, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-terms-condition',
  templateUrl: './terms-condition.component.html',
  styleUrls: ['./terms-condition.component.scss']
})
export class TermsConditionComponent implements OnInit,AfterViewInit {
  page_type:string;
  colorValue:any;
  margin_top:string;
  text_color:string;
  heading_color:string;
  hedear_bg:string;
  btn_color:string;

  constructor() 
   {
    this.page_type=sessionStorage.getItem('page_type');
    
   }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void{
    if(this.page_type==='paisaexch')
    {
      this.colorValue="#1b1b1b";
      this.margin_top=55+'px';
      this.text_color='white';
      this.heading_color='#FFC82B';
      this.btn_color='var(--theme1-bg)';
      this.hedear_bg='#FFC82B';
    }
    else if(this.page_type==='betHonk')
    {
      this.margin_top=129+'px';
      this.text_color='black';
      this.hedear_bg='#113a17';
      this.btn_color='#206764';
      this.heading_color='white';
    }
    else{
      this.text_color='black';
      this.heading_color='white';
      this.hedear_bg='var(--theme2-bg)';
      this.btn_color='var(--theme1-bg)';
    }
    document.documentElement.style.setProperty('--bg-color', this.colorValue);
    document.documentElement.style.setProperty('--text-color', this.text_color);
    document.documentElement.style.setProperty('--margin-top', this.margin_top);
    document.documentElement.style.setProperty('--heading-color', this.heading_color);
    document.documentElement.style.setProperty('--btn-color', this.btn_color);   
    document.documentElement.style.setProperty('--header-bg', this.hedear_bg);

  }

}
