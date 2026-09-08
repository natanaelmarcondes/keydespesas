import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Auth } from './core/auth';
import { Login } from './login';
import axe from 'axe-core';
describe('Local login', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [Login], providers: [provideRouter([])] });
  });
  afterEach(() => sessionStorage.clear());
  it('rejects incorrect credentials and accepts the fixed credentials', () => {
    const auth = TestBed.inject(Auth);
    expect(auth.login('natanaelmarcondes@gmail.com', 'wrong')).toBe(false);
    expect(auth.login('other@gmail.com', '050660')).toBe(false);
    expect(auth.authenticated()).toBe(false);
    expect(auth.login('natanaelmarcondes@gmail.com', '050660')).toBe(true);
    expect(auth.authenticated()).toBe(true);
    auth.logout();
    expect(auth.authenticated()).toBe(false);
    expect(sessionStorage.getItem('keydespesas-session')).toBeNull();
  });
  it('prefills the email and reports invalid login accessibly', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector<HTMLInputElement>('#email')?.value).toBe(
      'natanaelmarcondes@gmail.com',
    );
    fixture.componentInstance.model.set({ email: 'wrong@example.com', password: 'wrong' });
    fixture.componentInstance.login(new Event('submit'));
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('incorretos');
  });
  it('has no axe violations detectable in jsdom', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const result = await axe.run(fixture.nativeElement as HTMLElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) }))).toEqual(
      [],
    );
  });
});
