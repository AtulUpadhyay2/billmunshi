import React from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import { useGetProfileQuery } from "@/store/api/auth/authApiSlice";
import Loading from "@/components/Loading";

// import images
import ProfileImage from "@/assets/images/users/user-1.jpg";

const profile = () => {
  const { data: userProfile, error, isLoading } = useGetProfileQuery();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-5">
        <Card title="Error" noBorder>
          <div className="flex flex-col items-center justify-center py-8">
            <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-red-600 text-center">
              <p className="text-lg font-medium">Failed to load profile</p>
              <p className="text-sm text-gray-500 mt-2">
                {error?.data?.message || error?.message || 'An error occurred while fetching profile data'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Format date joined
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format last active
  const formatLastActive = (dateString) => {
    const now = new Date();
    const lastActive = new Date(dateString);
    const diffInMinutes = Math.floor((now - lastActive) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };
  return (
    <div>
      <div className="space-y-5 profile-page">
        <div className="profiel-wrap px-[35px] pb-10 md:pt-[84px] pt-10 rounded-lg bg-white dark:bg-slate-800 lg:flex lg:space-y-0 space-y-6 justify-between items-end relative z-1">
          <div className="bg-slate-900 dark:bg-slate-700 absolute left-0 top-0 md:h-1/2 h-[150px] w-full z-[-1] rounded-t-lg"></div>
          <div className="profile-box flex-none md:text-start text-center">
            <div className="md:flex items-end md:space-x-6 rtl:space-x-reverse">
              <div className="flex-none">
                <div className="md:h-[186px] md:w-[186px] h-[140px] w-[140px] md:ml-0 md:mr-0 ml-auto mr-auto md:mb-0 mb-4 rounded-full ring-4 ring-slate-100 relative">
                  {userProfile?.profile_image ? (
                    <img
                      src={userProfile.profile_image}
                      alt={userProfile.full_name || 'Profile'}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-4xl md:text-6xl font-bold">
                        {userProfile?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <Link
                    to="#"
                    className="absolute right-2 h-8 w-8 bg-slate-50 text-slate-600 rounded-full shadow-xs flex flex-col items-center justify-center md:top-[140px] top-[100px]"
                  >
                    <Icon icon="heroicons:pencil-square" />
                  </Link>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-medium text-slate-900 dark:text-slate-200 mb-[3px]">
                  {userProfile?.full_name || 'Unknown User'}
                </div>
                <div className="text-sm font-light text-slate-600 dark:text-slate-400 mb-2">
                  {userProfile?.bio || 'No bio available'}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    userProfile?.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {userProfile?.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {userProfile?.email_verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Email Verified
                    </span>
                  )}
                  {userProfile?.is_staff && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Staff
                    </span>
                  )}
                  {userProfile?.is_superuser && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-info-500 md:flex md:text-start text-center flex-1 max-w-[516px] md:space-y-0 space-y-4">
            <div className="flex-1">
              <div className="text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                {userProfile?.organizations?.length || 0}
              </div>
              <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                Organizations
              </div>
            </div>

            <div className="flex-1">
              <div className="text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                {formatLastActive(userProfile?.last_active)}
              </div>
              <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                Last Active
              </div>
            </div>

            <div className="flex-1">
              <div className="text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                {formatDate(userProfile?.date_joined)}
              </div>
              <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                Member Since
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="lg:col-span-6 col-span-12 space-y-6">
            <Card title="Personal Information">
              <ul className="list space-y-8">
                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:envelope" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      EMAIL
                    </div>
                    <a
                      href={`mailto:${userProfile?.email}`}
                      className="text-base text-slate-600 dark:text-slate-50"
                    >
                      {userProfile?.email || 'No email provided'}
                    </a>
                    <div className="flex items-center mt-1">
                      {userProfile?.email_verified ? (
                        <span className="inline-flex items-center text-xs text-green-600">
                          <Icon icon="heroicons:check-circle" className="w-3 h-3 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-red-600">
                          <Icon icon="heroicons:x-circle" className="w-3 h-3 mr-1" />
                          Not Verified
                        </span>
                      )}
                    </div>
                  </div>
                </li>

                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:phone-arrow-up-right" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      PHONE
                    </div>
                    {userProfile?.phone_number ? (
                      <a
                        href={`tel:${userProfile.phone_number}`}
                        className="text-base text-slate-600 dark:text-slate-50"
                      >
                        {userProfile.phone_number}
                      </a>
                    ) : (
                      <span className="text-base text-slate-400 dark:text-slate-500 italic">
                        No phone number provided
                      </span>
                    )}
                  </div>
                </li>

                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:calendar-days" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      MEMBER SINCE
                    </div>
                    <div className="text-base text-slate-600 dark:text-slate-50">
                      {formatDate(userProfile?.date_joined)}
                    </div>
                  </div>
                </li>
              </ul>
            </Card>

            {/* Account Status Card */}
            <Card title="Account Status">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon icon="heroicons:user-circle" className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">User Privileges</h3>
                      <p className="text-sm text-gray-600">Your account permissions and status</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Status:</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        userProfile?.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {userProfile?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Staff Member:</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        userProfile?.is_staff 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {userProfile?.is_staff ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Administrator:</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        userProfile?.is_superuser 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {userProfile?.is_superuser ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="lg:col-span-6 col-span-12 space-y-6">
            {/* Organizations Card */}
            {userProfile?.organizations && userProfile.organizations.length > 0 && (
              <Card title="Organizations" headerSlot={
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {userProfile.organizations.length} organization{userProfile.organizations.length > 1 ? 's' : ''}
                </span>
              }>
                <div className="space-y-4">
                  {userProfile.organizations.map((org, index) => (
                    <div key={org.id} className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-700 dark:to-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-600 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white text-lg font-bold">
                              {org.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-1">
                              {org.name}
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {org.slug}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            org.role === 'ADMIN' 
                              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm'
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                          }`}>
                            <Icon icon={org.role === 'ADMIN' ? 'heroicons:star' : 'heroicons:user'} className="w-3 h-3 mr-1" />
                            {org.role}
                          </span>
                          
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            org.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              org.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            {org.status}
                          </span>
                        </div>
                      </div>
                      
                      {/* Organization Stats */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                        <div className="text-center">
                          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Role Level
                          </div>
                          <div className={`text-sm font-semibold ${
                            org.role === 'ADMIN' ? 'text-purple-600' : 'text-blue-600'
                          }`}>
                            {org.role === 'ADMIN' ? 'Administrator' : 'Member'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Access Level
                          </div>
                          <div className={`text-sm font-semibold ${
                            org.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {org.status === 'ACTIVE' ? 'Full Access' : 'Limited'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Activity Info Card */}
            <Card title="Activity & Statistics">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Icon icon="heroicons:clock" className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
                    <p className="text-sm text-gray-600">Recent activity and account statistics</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-sm font-medium text-gray-700">Last Active:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatLastActive(userProfile?.last_active)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-sm font-medium text-gray-700">Organizations:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {userProfile?.organizations?.length || 0} active
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-sm font-medium text-gray-700">User ID:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      #{userProfile?.id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-700">Account Type:</span>
                    <div className="flex gap-1">
                      {userProfile?.is_superuser && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Admin
                        </span>
                      )}
                      {userProfile?.is_staff && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Staff
                        </span>
                      )}
                      {!userProfile?.is_staff && !userProfile?.is_superuser && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          User
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default profile;
