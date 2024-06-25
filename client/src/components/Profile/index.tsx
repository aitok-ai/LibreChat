import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '../ui/Tabs';
import { cn } from '~/utils';
import useDocumentTitle from '~/hooks/useDocumentTitle';
import { useNavigate, useParams } from 'react-router-dom';
import { TUser } from 'librechat-data-provider';
import {
  useFollowUserMutation,
  useGetStartupConfig,
  useGetUserByIdQuery,
} from 'librechat-data-provider/react-query';
import { useAuthContext } from '~/hooks/AuthContext';
import LikedConversations from './LikedConversation';
import PublicConversations from './PublicConversations';
import { Spinner } from '../svg';
import UserIcon from '../svg/UserIcon';
import CheckMark from '../svg/CheckMark';
import EditIcon from '../svg/EditIcon';
import { useLocalize } from '~/hooks';

function ProfileContent() {
  const initialBio = '来个大开脑洞，自爆一下你的人生经验，让大家开开眼界！';
  // let initialProfession = '未填写';
  const [tabValue, setTabValue] = useState<string>('');
  const [profileUser, setProfileUser] = useState<TUser | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [isFollower, setIsFollower] = useState<boolean>(false);
  const [numOfFollowers, setNumOfFollowers] = useState<number>(0);
  const [numOfFollowing, setNumOfFollowing] = useState<number>(0);
  const [proMemberExpiredAt, setProMemberExpiredAt] = useState<Date>(new Date());
  const [editMode, setEditMode] = useState<boolean>(false);
  const [bio, setBio] = useState(initialBio || '');
  const [quotaUsage, setQuotaUsage] = useState<object>({}); // Monthly quota usage
  // const [profession, setProfession] = useState(initialProfession || '');
  // new commit
  const { userId = '' } = useParams();
  const { user, token } = useAuthContext();
  const localize = useLocalize();
  let lang = localStorage.getItem('lang');
  lang = lang ? lang.substring(0, 2) : 'en';
  const navigate = useNavigate();
  useDocumentTitle('Profile');

  const getUserByIdQuery = useGetUserByIdQuery(userId);
  const followUserMutation = useFollowUserMutation();
  const { data: startupConfig } = useGetStartupConfig();

  const defaultClasses = 'p-2 rounded-md min-w-[75px] font-normal text-xs';
  const defaultSelected = cn(
    defaultClasses,
    'font-medium data-[state=active]:text-white text-xs text-white',
  );

  // Component to display user's followers and who they are following
  // Displays username only
  function ListItem({ id, info }: { id: string; info: TUser }) {
    const [copied, setCopied] = useState<boolean>(false);

    return (
      <div className="group relative my-2 flex cursor-pointer flex-row items-center">
        <div
          className="flex h-full w-full flex-row items-center gap-2 rounded-lg px-2 py-2 text-base hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-600"
          onClick={() => {
            navigate(`/profile/${id}`);
          }}
        >
          <UserIcon />
          <div className="w-56 truncate">{info.username}</div>
        </div>

        {/*Copy profile URL button */}
        <button
          className="visible absolute right-1 z-10 rounded-md p-1 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-600"
          onClick={() => {
            if (copied === true) {
              return;
            }

            navigator.clipboard.writeText(
              window.location.protocol + '//' + window.location.host + `/profile/${id}`,
            );
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? (
            <div className="flex w-[92px] flex-row items-center gap-1">
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {localize('com_ui_copy_success')}
            </div>
          ) : (
            <div className="flex w-[92px] flex-row items-center gap-1">
              <svg
                className="h-5 w-5"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g id="Communication / Share_iOS_Export">
                  <path
                    id="Vector"
                    d="M9 6L12 3M12 3L15 6M12 3V13M7.00023 10C6.06835 10 5.60241 10 5.23486 10.1522C4.74481 10.3552 4.35523 10.7448 4.15224 11.2349C4 11.6024 4 12.0681 4 13V17.8C4 18.9201 4 19.4798 4.21799 19.9076C4.40973 20.2839 4.71547 20.5905 5.0918 20.7822C5.5192 21 6.07899 21 7.19691 21H16.8036C17.9215 21 18.4805 21 18.9079 20.7822C19.2842 20.5905 19.5905 20.2839 19.7822 19.9076C20 19.4802 20 18.921 20 17.8031V13C20 12.0681 19.9999 11.6024 19.8477 11.2349C19.6447 10.7448 19.2554 10.3552 18.7654 10.1522C18.3978 10 17.9319 10 17 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
              {localize('com_ui_share')}
            </div>
          )}
        </button>
      </div>
    );
  }

  const followUserController = () => {
    const payload = {
      user: user,
      otherUser: profileUser,
    };

    if (profileUser) {
      if (profileUser.followers && profileUser.followers[`${user?.id}`]) {
        payload['isFollowing'] = false;
        delete user?.following[profileUser.id];
      } else {
        payload['isFollowing'] = true;
        if (user) {
          user.following[profileUser.id] = new Date();
        }
      }
    }

    followUserMutation.mutate(payload);
  };

  const handleEditProfile = (): void => {
    if (bio === '') {
      setBio(initialBio); // Reset bio to initial value if it's empty
    }
    setEditMode((prev) => !prev);
  };

  // submit biography
  const handleSubmit = async (e) => {
    e.preventDefault();
    const requestBody = {
      biography: bio,
      // profession: profession
    };

    try {
      const bioResponse = await fetch(`/api/user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      if (bioResponse.ok) {
        const responseData = await bioResponse.json();
        if (responseData.biography === '') {
          setBio(initialBio);
        } else {
          setBio(responseData.biography);
        }
        handleEditProfile();
      }
    } catch (error) {
      alert(`An error occurred: ${error}`);
    }
  };

  const handleUsernameChange = (e) => {
    // Update the newUsername state as the user types
    setNewUsername(e.target.value);
  };

  // submit username
  const handleChangeUsername = async (e) => {
    e.preventDefault();
    console.log('newUsername', newUsername);
    const requestBody = {
      username: newUsername,
    };

    try {
      const usernameResponse = await fetch(`/api/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      if (usernameResponse.ok) {
        const responseData = await usernameResponse.json();
        console.log('res data from backend', responseData);
        if (responseData.username === '') {
          alert('必填 required');
          return;
        } else {
          setNewUsername(responseData?.username);
        }
      }
    } catch (error) {
      alert(`An error occurred: ${error}`);
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (getUserByIdQuery.isSuccess) {
      setProfileUser(getUserByIdQuery.data);
      setNewUsername(getUserByIdQuery.data?.username);
      // Set biography from fetched data or use initial value
      // Set biography from fetched data or use initial value
      if (getUserByIdQuery.data?.biography === '') {
        setBio(initialBio);
      } else {
        setBio(getUserByIdQuery.data?.biography);
      }

      if (getUserByIdQuery.data.followers) {
        setIsFollower(getUserByIdQuery.data.followers[`${user?.id}`] ? true : false);
        setNumOfFollowers(Object.keys(getUserByIdQuery.data.followers).length);
      } else {
        setIsFollower(false);
        setNumOfFollowers(0);
      }

      if (getUserByIdQuery.data.following) {
        setNumOfFollowing(Object.keys(getUserByIdQuery.data.following).length);
      } else {
        setNumOfFollowing(0);
      }

      if (getUserByIdQuery.data.proMemberExpiredAt) {
        setProMemberExpiredAt(new Date(getUserByIdQuery.data?.proMemberExpiredAt));
      } else {
        setProMemberExpiredAt(new Date());
      }

      if (getUserByIdQuery.data.monthlyQuotaConsumed) {
        setQuotaUsage(getUserByIdQuery.data.monthlyQuotaConsumed);
      } else {
        setQuotaUsage({});
      }
    }
  }, [getUserByIdQuery.isSuccess, getUserByIdQuery.data, user]);

  useEffect(() => {
    if (userId === user?.id) {
      setTabValue('followers');
    } else {
      setTabValue('conversations');
    }
  }, [user, userId]);

  // toggle expand button
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded((prev) => !prev);
  };

  useEffect(() => {
    if (followUserMutation.isSuccess) {
      setProfileUser(followUserMutation.data);
      setIsFollower(!isFollower);

      if (followUserMutation.data.followers) {
        setNumOfFollowers(Object.keys(followUserMutation.data.followers).length);
      }

      if (followUserMutation.data.following) {
        setNumOfFollowing(Object.keys(followUserMutation.data.following).length);
      }
    }
  }, [followUserMutation.isSuccess, followUserMutation.data, isFollower]);

  const [isEditing, setIsEditing] = useState(false);
  const handleUsernameClick = () => {
    setIsEditing(true);
  };

  return (
    <>
      <button
        className="absolute right-0 top-12 mx-2 my-1 flex w-fit flex-row items-center rounded-md px-3 py-2 text-gray-800 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-600 md:left-12 md:top-1"
        onClick={() => {
          history.back();
        }}
      >
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth="2"
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="1" y1="12" x2="19" y2="12" />
          <polyline points="8 19 1 12 8 5" />
        </svg>
        {localize('com_ui_back')}
      </button>
      <div className="flex h-full flex-col justify-center md:mx-36">
        <div className="mt-6 flex flex-col flex-wrap items-start md:my-4 md:flex-row md:gap-6">
          <div className="row flex flex items-center">
            <div
              title="User Icon"
              className="relative mx-4 my-1 flex items-center justify-center md:my-3 md:ml-12"
            >
              <img
                className="rounded-md"
                src={
                  profileUser?.avatar ||
                  `https://api.dicebear.com/6.x/initials/svg?seed=${profileUser?.name}&fontFamily=Verdana&fontSize=36&size=96`
                }
                alt="avatar"
              />
            </div>
            <div className="mx-3 flex flex-col justify-center gap-4 text-xl dark:text-gray-200">
              <div>{profileUser?.name}</div>
              <div onClick={handleUsernameClick}>
                {isEditing ? (
                  <div>
                    <form onSubmit={handleChangeUsername}>
                      <input
                        className="pl-2 text-black"
                        type="text"
                        id="newUsernameInput"
                        placeholder="Enter new username"
                        value={newUsername}
                        onChange={handleUsernameChange}
                      />
                      <button className="pl-4" type="submit">
                        <CheckMark />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div>{newUsername}</div>
                )}
              </div>
            </div>
          </div>

          {/*change username */}

          {/*Copy profile page URL button */}
          <div className="flex flex-row items-center gap-4 self-center px-3 py-3 text-lg">
            <button
              className="w-32 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => {
                if (copied) {
                  return;
                }
                setCopied(true);
                window.navigator.clipboard.writeText(window.location.href);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <div className="flex flex-col items-center">
                {copied ? (
                  <>
                    <svg
                      stroke="currentColor"
                      fill="none"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      height="1em"
                      width="1em"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {localize('com_ui_copy_success')}
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5"
                      width="1em"
                      height="1em"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g id="Communication / Share_iOS_Export">
                        <path
                          id="Vector"
                          d="M9 6L12 3M12 3L15 6M12 3V13M7.00023 10C6.06835 10 5.60241 10 5.23486 10.1522C4.74481 10.3552 4.35523 10.7448 4.15224 11.2349C4 11.6024 4 12.0681 4 13V17.8C4 18.9201 4 19.4798 4.21799 19.9076C4.40973 20.2839 4.71547 20.5905 5.0918 20.7822C5.5192 21 6.07899 21 7.19691 21H16.8036C17.9215 21 18.4805 21 18.9079 20.7822C19.2842 20.5905 19.5905 20.2839 19.7822 19.9076C20 19.4802 20 18.921 20 17.8031V13C20 12.0681 19.9999 11.6024 19.8477 11.2349C19.6447 10.7448 19.2554 10.3552 18.7654 10.1522C18.3978 10 17.9319 10 17 10"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    </svg>
                    {localize('com_ui_share_profile')}
                  </>
                )}
              </div>
            </button>
            {/*Number of followers */}
            <button
              className="flex w-24 flex-col items-center leading-[22px] text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => {
                setTabValue('followers');
              }}
            >
              {numOfFollowers}
              <br />
              {localize('com_ui_followers')}
            </button>
            {/*Number of following */}
            <button
              className="flex w-24 flex-col items-center leading-[22px] text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => {
                setTabValue('following');
              }}
            >
              {numOfFollowing}
              <br />
              {localize('com_ui_following')}
            </button>
          </div>
          {/*Follow user button */}
          {userId !== user?.id && profileUser && user && (
            <button
              className="w-24 self-center rounded-md bg-gray-200 px-3 py-1 text-center text-lg font-bold text-gray-800 hover:text-black dark:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={followUserController}
            >
              {isFollower ? localize('com_ui_unfollow') : localize('com_ui_follow')}
            </button>
          )}
        </div>
        {/* Subscription */}
        {userId === user?.id ? (
          proMemberExpiredAt && proMemberExpiredAt > new Date() ? (
            // Current user: show subscription
            <div className="w-full rounded-lg p-6 dark:text-gray-200">
              <div className="pl-7">
                {localize('com_ui_pro_member_expired_at')}: {proMemberExpiredAt.getFullYear()}-
                {proMemberExpiredAt.getMonth() + 1}-{proMemberExpiredAt.getDate()}
                <button
                  type="submit"
                  className="ml-2 rounded bg-blue-500 px-4 py-1 text-white hover:bg-blue-600"
                  onClick={() =>
                    window.open(
                      `${startupConfig?.proMemberPaymentURL}?locale=${lang}&prefilled_email=${profileUser?.email}`,
                    )
                  }
                >
                  {localize('com_ui_renewal_pro_member')}
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full rounded-lg p-6 dark:text-gray-200">
              <div className="pl-7">
                {localize('com_ui_free_member')}
                <button
                  type="submit"
                  className="ml-2 rounded bg-blue-500 px-4 py-1 text-white hover:bg-blue-600"
                  onClick={() =>
                    window.open(
                      `${startupConfig?.proMemberPaymentURL}?locale=${lang}&prefilled_email=${profileUser?.email}`,
                    )
                  }
                >
                  {localize('com_ui_become_pro_member')}
                </button>
              </div>
            </div>
          )
        ) : (
          <div></div>
        )}

        {/* Monthly Quota Usage: a table of quota and usage based on object quotaUsage */}
        <div className="w-full rounded-lg p-6 dark:text-gray-200">
          <div className="pl-7">
            <table className="w-full border-collapse border-2 border-gray-500">
              <thead>
                <tr>
                  <th className="border-2 border-gray-500 text-left">{localize('com_ui_model')}</th>
                  <th className="border-2 border-gray-500 text-left">{localize('com_ui_usage')}</th>
                  <th className="border-2 border-gray-500 text-left">{localize('com_ui_quota')}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(quotaUsage).map(([key, value]) => (
                  <tr key={key}>
                    <td className="border-2 border-gray-500">{key}</td>
                    <td className="border-2 border-gray-500">{value.consumed}</td>
                    <td className="border-2 border-gray-500">{value.quota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User bio */}
        {userId === user?.id ? (
          // Current user's profile view
          <div className="w-full rounded-lg p-6 dark:text-gray-200">
            {editMode ? (
              // Edit mode
              <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
                <div className="flex items-center">
                  <label htmlFor="bio" className="flex items-center justify-center pl-5 pr-5">
                    <span className="text-lg">{localize('com_ui_about_yourself')}</span>
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    placeholder="分享一下你的兴趣、技能和人生态度..."
                    onChange={(e) => setBio(e.target.value)}
                    className="flex-1 border border-gray-300 bg-transparent p-2"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={handleEditProfile}
                    className="rounded px-4 py-1 hover:bg-gray-500"
                  >
                    {localize('com_ui_back')}
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-green-500 px-4 py-1 text-white hover:bg-green-600"
                    onClick={handleSubmit}
                  >
                    {localize('com_ui_save')}
                  </button>
                </div>
              </form>
            ) : (
              // Profile view mode
              <>
                <div className="pl-1">
                  {expanded ? (
                    <div>
                      <div className="pl-1">{bio}</div>
                      <button
                        className="ml-2 text-green-500 hover:text-green-300"
                        onClick={toggleExpand}
                      >
                        Show Less
                      </button>
                    </div>
                  ) : (
                    <div className="pl-1">
                      {bio?.length > 100 ? `${bio.slice(0, 100)}...` : bio}
                      {bio?.length > 100 && (
                        <button
                          className="ml-2 text-green-500 hover:text-green-300"
                          onClick={toggleExpand}
                        >
                          {expanded ? 'Show Less' : 'Show More'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col md:flex-row md:items-start md:space-x-4">
                  <div className="ml-auto md:flex-none">
                    <p className="mt-4">
                      <button
                        className="flex w-24 flex-col items-center leading-[22px] text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={handleEditProfile}
                      >
                        <EditIcon />
                      </button>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          // Other user's profile view
          <div className="w-full rounded-lg p-6 dark:text-gray-200">
            <div className="pl-7">{bio}</div>
          </div>
        )}

        {/*Tabs and tab content */}
        <div className="flex flex-col items-center">
          <Tabs
            value={tabValue}
            onValueChange={(value: string) => setTabValue(value)}
            className={defaultClasses}
          >
            <TabsList className="rounded-lg bg-blue-500 dark:bg-blue-500">
              {/* {userId === user?.id && (
                <TabsTrigger value="likes" className="px-4 py-2 text-white dark:text-white">
                  {localize('com_ui_my_likes')}
                </TabsTrigger>
              )} */}
              {userId != user?.id && (
                <TabsTrigger value="conversations" className="px-4 py-2 text-white dark:text-white">
                  {localize('com_ui_conversations')}
                </TabsTrigger>
              )}
              <TabsTrigger value="followers" className="px-4 py-2 text-white dark:text-white">
                {localize('com_ui_followers')}
              </TabsTrigger>
              <TabsTrigger value="following" className="px-4 py-2 text-white dark:text-white">
                {localize('com_ui_following')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex h-full flex-col overflow-y-auto border-t-2">
          {tabValue === 'likes' && <LikedConversations key={userId} />}
          {tabValue === 'conversations' && <PublicConversations key={userId} />}

          {/*New followers and follwings are added at the end of the object in MongoDB. */}
          {/*We reverse the array to dsiplay the most recent follwers and followings at the top. */}
          {tabValue === 'followers' && (
            <div>
              {Object.entries(profileUser?.followers || {})
                .reverse()
                .map(([id, info]) => (
                  <ListItem key={id} id={id} info={info} />
                ))}
            </div>
          )}
          {tabValue === 'following' && (
            <div>
              {Object.entries(profileUser?.following || {})
                .reverse()
                .map(([id, info]) => (
                  <ListItem key={id} id={id} info={info} />
                ))}
            </div>
          )}
          {tabValue === '' && <Spinner />}
        </div>
      </div>
    </>
  );
}

// To avoid internal state mixture
function Profile() {
  const { userId } = useParams();

  return <ProfileContent key={userId} />;
}

export default Profile;
