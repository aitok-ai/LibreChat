import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetStartupConfig } from 'librechat-data-provider/react-query';
import { GoogleIcon, FacebookIcon, OpenIDIcon, GithubIcon, DiscordIcon } from '~/components';
import { useAuthContext } from '~/hooks/AuthContext';
import { ThemeSelector } from '~/components/ui';
import SocialButton from './SocialButton';
import { getLoginError } from '~/utils';
import { useLocalize } from '~/hooks';
import LoginForm from './LoginForm';

function Login() {
  localStorage.setItem('isSharedPage', 'false');
  const { login, error, isAuthenticated } = useAuthContext();
  const { data: startupConfig } = useGetStartupConfig();
  const localize = useLocalize();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/c/new', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!startupConfig) {
    return null;
  }

  const socialLogins = startupConfig.socialLogins ?? [];

  const providerComponents = {
    discord: (
      <SocialButton
        key="discord"
        enabled={startupConfig.discordLoginEnabled}
        serverDomain={startupConfig.serverDomain}
        oauthPath="discord"
        Icon={DiscordIcon}
        label={localize('com_auth_discord_login')}
        id="discord"
      />
    ),
    facebook: (
      <SocialButton
        key="facebook"
        enabled={startupConfig.facebookLoginEnabled}
        serverDomain={startupConfig.serverDomain}
        oauthPath="facebook"
        Icon={FacebookIcon}
        label={localize('com_auth_facebook_login')}
        id="facebook"
      />
    ),
    github: (
      <SocialButton
        key="github"
        enabled={startupConfig.githubLoginEnabled}
        serverDomain={startupConfig.serverDomain}
        oauthPath="github"
        Icon={GithubIcon}
        label={localize('com_auth_github_login')}
        id="github"
      />
    ),
    google: (
      <SocialButton
        key="google"
        enabled={startupConfig.googleLoginEnabled}
        serverDomain={startupConfig.serverDomain}
        oauthPath="google"
        Icon={GoogleIcon}
        label={localize('com_auth_google_login')}
        id="google"
      />
    ),
    openid: (
      <SocialButton
        key="openid"
        enabled={startupConfig.openidLoginEnabled}
        serverDomain={startupConfig.serverDomain}
        oauthPath="openid"
        Icon={() =>
          startupConfig.openidImageUrl ? (
            <img src={startupConfig.openidImageUrl} alt="OpenID Logo" className="h-5 w-5" />
          ) : (
            <OpenIDIcon />
          )
        }
        label={startupConfig.openidLabel}
        id="openid"
      />
    ),
  };

  const privacyPolicy = startupConfig.interface?.privacyPolicy;
  const termsOfService = startupConfig.interface?.termsOfService;

  const privacyPolicyRender = privacyPolicy?.externalUrl && (
    <a
      className="text-sm text-green-500"
      href={privacyPolicy.externalUrl}
      target={privacyPolicy.openNewTab ? '_blank' : undefined}
      rel="noreferrer"
    >
      {localize('com_ui_privacy_policy')}
    </a>
  );

  const termsOfServiceRender = termsOfService?.externalUrl && (
    <a
      className="text-sm text-green-500"
      href={termsOfService.externalUrl}
      target={termsOfService.openNewTab ? '_blank' : undefined}
      rel="noreferrer"
    >
      {localize('com_ui_terms_of_service')}
    </a>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white pt-6 sm:pt-0">
      <div className="mt-6 w-96 overflow-hidden bg-white px-6 py-4 sm:max-w-md sm:rounded-lg">
        <h1 className="mb-4 text-center text-3xl font-semibold">
          {localize('com_auth_welcome_back')}
        </h1>
        {error && (
          <div
            className="relative mt-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
            role="alert"
          >
            {localize(getLoginError(error))}
          </div>
        )}
        <LoginForm onSubmit={login} />
        {/*{startupConfig?.registrationEnabled &&*/}
        {/*  !window.location.hostname.match(/^(.*\.)?toatu\.com$/) && (*/}
        {/*  <p className="my-4 text-center text-sm font-light text-gray-700">*/}
        {/*    {' '}*/}
        {/*    {localize('com_auth_no_account')}{' '}*/}
        {/*    <a href="/register" className="p-1 font-medium text-green-500 hover:underline">*/}
        {/*      {localize('com_auth_sign_up')}*/}
        {/*    </a>*/}
        {/*  </p>*/}
        {/*)}*/}
        {/*{startupConfig?.socialLoginEnabled &&*/}
        {/*  !window.location.hostname.match(/^(.*\.)?toatu\.com$/) && (*/}
        {/*  <>*/}
        {/*    <div className="relative mt-6 flex w-full items-center justify-center border border-t uppercase">*/}
        {/*      <div className="absolute bg-white px-3 text-xs">Or</div>*/}
        {/*    </div>*/}
        {/*    <div className="mt-8" />*/}
        {/*  </>*/}
        {/*)}*/}
        {/*{startupConfig?.googleLoginEnabled &&*/}
        {/*  !window.location.hostname.match(/^(.*\.)?toatu\.com$/) &&*/}
        {/*  startupConfig?.socialLoginEnabled && (*/}
        {/*  <>*/}
        {/*    <div className="mt-2 flex gap-x-2">*/}
        {/*      <a*/}
        {/*        aria-label="Login with Google"*/}
        {/*        className="justify-left flex w-full items-center space-x-3 rounded-md border border-gray-300 px-5 py-3 hover:bg-gray-50 focus:ring-2 focus:ring-violet-600 focus:ring-offset-1"*/}
        {/*        href={`${startupConfig.serverDomain}/oauth/google`}*/}
        {/*      >*/}
        {/*        <GoogleIcon />*/}
        {/*        <p>{localize('com_auth_google_login')}</p>*/}
        {/*      </a>*/}
        {/*    </div>*/}
        {/*  </>*/}
        {/*)}*/}
        {startupConfig?.facebookLoginEnabled && startupConfig?.socialLoginEnabled && (
          <>
            <div className="mt-2 flex gap-x-2">
              <a
                aria-label="Login with Facebook"
                className="justify-left flex w-full items-center space-x-3 rounded-md border border-gray-300 px-5 py-3 hover:bg-gray-50 focus:ring-2 focus:ring-violet-600 focus:ring-offset-1"
                href={`${startupConfig.serverDomain}/oauth/facebook`}
              >
                <FacebookIcon />
                <p>{localize('com_auth_facebook_login')}</p>
              </a>
            </div>
          </>
        )}
        {startupConfig?.openidLoginEnabled && startupConfig?.socialLoginEnabled && (
          <>
            <div className="mt-2 flex gap-x-2">
              <a
                aria-label="Login with OpenID"
                className="justify-left flex w-full items-center space-x-3 rounded-md border border-gray-300 px-5 py-3 hover:bg-gray-50 focus:ring-2 focus:ring-violet-600 focus:ring-offset-1"
                href={`${startupConfig.serverDomain}/oauth/openid`}
              >
                {startupConfig.openidImageUrl ? (
                  <img src={startupConfig.openidImageUrl} alt="OpenID Logo" className="h-5 w-5" />
                ) : (
                  <OpenIDIcon />
                )}
                <p>{startupConfig.openidLabel}</p>
              </a>
            </div>
          </>
        )}
        {startupConfig?.githubLoginEnabled && startupConfig?.socialLoginEnabled && (
          <>
            <div className="mt-2 flex gap-x-2">
              <a
                aria-label="Login with GitHub"
                className="justify-left flex w-full items-center space-x-3 rounded-md border border-gray-300 px-5 py-3 hover:bg-gray-50 focus:ring-2 focus:ring-violet-600 focus:ring-offset-1"
                href={`${startupConfig.serverDomain}/oauth/github`}
              >
                <GithubIcon />
                <p>{localize('com_auth_github_login')}</p>
              </a>
            </div>
          </>
        )}
        {startupConfig?.discordLoginEnabled && startupConfig?.socialLoginEnabled && (
          <>
            <div className="mt-2 flex gap-x-2">
              <a
                aria-label="Login with Discord"
                className="justify-left flex w-full items-center space-x-3 rounded-md border border-gray-300 px-5 py-3 hover:bg-gray-50 focus:ring-2 focus:ring-violet-600 focus:ring-offset-1"
                href={`${startupConfig.serverDomain}/oauth/discord`}
              >
                <DiscordIcon />
                <p>{localize('com_auth_discord_login')}</p>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
