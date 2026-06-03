import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@librechat/client';
import { cn } from '~/utils';
import useDocumentTitle from '~/hooks/useDocumentTitle';
import { useNavigate, useParams } from 'react-router-dom';
import { TUser } from 'librechat-data-provider';
import {
  useFollowUserMutation,
  //useGetStartupConfig,
  useGetUserByIdQuery,
} from 'librechat-data-provider/react-query';
import { useGetStartupConfig } from '~/data-provider';
import { useAuthContext } from '~/hooks/AuthContext';
import LikedConversations from './LikedConversation';
import PublicConversations from './PublicConversations';
import { Spinner } from '@librechat/client';
import { UserIcon } from '@librechat/client';
import { CheckMark } from '@librechat/client';
import { EditIcon } from '@librechat/client';
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

  // Component to display user's followers and who they are following
  // Displays username only
  function ListItem({ id, info }: { id: string; info: TUser }) {
    const [copied, setCopied] = useState<boolean>(false);

    return (
      <div className="group relative my-1 flex cursor-pointer flex-row items-center">
        <div
          className="flex h-full w-full flex-row items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-base transition-all hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm dark:text-gray-200 dark:hover:border-gray-700 dark:hover:bg-gray-800"
          onClick={() => {
            navigate(`/profile/${id}`);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              navigate(`/profile/${id}`);
            }
          }}
          tabIndex={0}
          role="button"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-sm">
            <UserIcon />
          </div>
          <div className="flex-1 truncate font-medium text-gray-900 dark:text-gray-100">
            {info.username}
          </div>
        </div>

        {/*Copy profile URL button */}
        <button
          className="absolute right-2 z-10 rounded-lg p-2 text-gray-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
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
          aria-label="分享个人资料"
        >
          {copied ? (
            <div className="flex flex-row items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="hidden sm:inline">{localize('com_ui_copy_success')}</span>
            </div>
          ) : (
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
      setNewUsername(getUserByIdQuery.data.username);
      // Set biography from fetched data or use initial value
      // Set biography from fetched data or use initial value
      if (getUserByIdQuery.data.biography === '' || getUserByIdQuery.data.biography == null) {
        setBio(initialBio);
      } else {
        setBio(getUserByIdQuery.data.biography);
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
        setProMemberExpiredAt(new Date(getUserByIdQuery.data.proMemberExpiredAt));
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
  // Removed unused variable: membershipContent

  return (
    <>
      <button
        className="absolute top-12 right-0 mx-2 my-1 flex w-fit flex-row items-center rounded-md px-3 py-2 text-gray-800 hover:bg-gray-200 md:top-1 md:left-12 dark:text-gray-200 dark:hover:bg-gray-600"
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
          <div className="row flex items-center">
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
                      <button className="pl-4" type="submit" aria-label="提交用户名更改">
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
        {/* Subscription - 优化的会员信息卡片 */}
        {userId === user?.id && (
          <div className="mx-4 my-4 md:mx-12">
            {proMemberExpiredAt && proMemberExpiredAt > new Date() ? (
              // Pro会员卡片
              <div className="rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-md dark:border-blue-400 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                        {localize('com_ui_pro_member')}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {localize('com_ui_pro_member_expired_at')}:{' '}
                        {proMemberExpiredAt.getFullYear()}-
                        {String(proMemberExpiredAt.getMonth() + 1).padStart(2, '0')}-
                        {String(proMemberExpiredAt.getDate()).padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg bg-blue-500 px-6 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-blue-600 hover:shadow-md active:scale-95"
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
              // 免费会员卡片
              <div className="rounded-xl border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50 p-6 shadow-md dark:border-gray-600 dark:from-gray-800/50 dark:to-slate-800/50">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-400 text-white dark:bg-gray-600">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {localize('com_ui_free_member')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {localize('com_ui_upgrade_message')}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg bg-blue-500 px-6 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-blue-600 hover:shadow-md active:scale-95"
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
            )}
          </div>
        )}

        {/* Monthly Quota Usage - 优化的使用情况表格 */}
        {Object.keys(quotaUsage).length > 0 && (
          <div className="mx-4 my-4 md:mx-12">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {localize('com_ui_usage_30days')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {localize('com_ui_model')}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {localize('com_ui_usage_count')}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {localize('com_ui_quota')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {Object.entries(quotaUsage).map(([key, value]) => (
                      <tr
                        key={key}
                        className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {key}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <span>{value.consumed}</span>
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                              {}
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all"
                                style={{
                                  width: `${Math.min((value.consumed / value.quota) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {value.quota}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User bio - 优化的个人简介 */}
        <div className="mx-4 my-4 md:mx-12">
          {userId === user?.id ? (
            // Current user's profile view
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              {editMode ? (
                // Edit mode
                <form className="p-6" onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label
                      htmlFor="bio"
                      className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      {localize('com_ui_about_yourself')}
                    </label>
                    <textarea
                      id="bio"
                      value={bio}
                      placeholder="分享一下你的兴趣、技能和人生态度..."
                      onChange={(e) => setBio(e.target.value)}
                      rows={6}
                      className="w-full rounded-lg border border-gray-300 bg-transparent p-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:text-gray-100 dark:focus:border-blue-400"
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleEditProfile}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {localize('com_ui_back')}
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-green-600 active:scale-95"
                    >
                      {localize('com_ui_save')}
                    </button>
                  </div>
                </form>
              ) : (
                // Profile view mode
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {localize('com_ui_bio')}
                      </h3>
                      <div className="text-gray-600 dark:text-gray-400">
                        {expanded ? (
                          <div>
                            <p className="leading-relaxed whitespace-pre-wrap">{bio}</p>
                            {bio.length > 100 && (
                              <button
                                className="mt-2 text-sm font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                onClick={toggleExpand}
                              >
                                {localize('com_ui_show_less')}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="leading-relaxed whitespace-pre-wrap">
                              {bio.length > 100 ? `${bio.slice(0, 100)}...` : bio}
                            </p>
                            {bio.length > 100 && (
                              <button
                                className="mt-2 text-sm font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                onClick={toggleExpand}
                              >
                                {localize('com_ui_show_more')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      className="ml-4 rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                      onClick={handleEditProfile}
                      title="编辑简介"
                    >
                      <EditIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Other user's profile view
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {localize('com_ui_bio')}
              </h3>
              <p className="leading-relaxed whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                {bio}
              </p>
            </div>
          )}
        </div>

        {/*Tabs and tab content - 优化的标签页 */}
        <div className="mx-4 my-6 flex flex-col md:mx-12">
          <Tabs
            value={tabValue}
            onValueChange={(value: string) => setTabValue(value)}
            className="w-full"
          >
            <TabsList className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
              {userId != user?.id && (
                <TabsTrigger
                  value="conversations"
                  className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm dark:text-gray-400 dark:hover:text-gray-200 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400"
                >
                  {localize('com_ui_conversations')}
                </TabsTrigger>
              )}
              <TabsTrigger
                value="followers"
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm dark:text-gray-400 dark:hover:text-gray-200 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400"
              >
                {localize('com_ui_followers')}
              </TabsTrigger>
              <TabsTrigger
                value="following"
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:text-gray-900 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm dark:text-gray-400 dark:hover:text-gray-200 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400"
              >
                {localize('com_ui_following')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab content - 优化的内容区域 */}
        <div className="mx-4 flex h-full flex-col overflow-y-auto md:mx-12">
          {tabValue === 'likes' && <LikedConversations key={userId} />}
          {tabValue === 'conversations' && <PublicConversations key={userId} />}

          {/*New followers and follwings are added at the end of the object in MongoDB. */}
          {/*We reverse the array to dsiplay the most recent follwers and followings at the top. */}
          {tabValue === 'followers' && (
            <div className="space-y-1">
              {Object.keys(profileUser?.followers || {}).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                  <svg
                    className="mb-3 h-16 w-16 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="text-sm">{localize('com_ui_no_followers')}</p>
                </div>
              ) : (
                Object.entries(profileUser?.followers || {})
                  .reverse()
                  .map(([id, info]) => <ListItem key={id} id={id} info={info} />)
              )}
            </div>
          )}
          {tabValue === 'following' && (
            <div className="space-y-1">
              {Object.keys(profileUser?.following || {}).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                  <svg
                    className="mb-3 h-16 w-16 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="text-sm">{localize('com_ui_no_following')}</p>
                </div>
              ) : (
                Object.entries(profileUser?.following || {})
                  .reverse()
                  .map(([id, info]) => <ListItem key={id} id={id} info={info} />)
              )}
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
