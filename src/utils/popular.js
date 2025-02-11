import AV from 'leancloud-storage';

/**
 * 获取热门用户列表
 * @param {number} limit - 返回的用户数量
 * @returns {Promise<Array>} 热门用户列表
 */
export const getPopularUsers = async (limit = 20) => {
    try {
        // 创建用户查询
        const userQuery = new AV.Query('_User');
        
        // 添加作品数量字段
        userQuery.descending('worksCount');
        // 添加粉丝数量字段
        userQuery.descending('followersCount');
        // 只获取公开的用户
        userQuery.equalTo('isPublic', true);
        
        // 设置返回数量
        userQuery.limit(limit);
        
        // 执行查询
        const users = await userQuery.find();
        
        // 格式化结果
        return users.map(user => ({
            id: user.id,
            username: user.get('username'),
            avatar: user.get('avatar'),
            bio: user.get('bio'),
            worksCount: user.get('worksCount') || 0,
            followersCount: user.get('followersCount') || 0
        }));
    } catch (error) {
        console.error('Failed to fetch popular users:', error);
        return [];
    }
};

/**
 * 获取热门作品列表
 * @param {number} limit - 返回的作品数量
 * @returns {Promise<Array>} 热门作品列表
 */
export const getPopularWorks = async (limit = 50) => {
    try {
        // 创建作品查询
        const workQuery = new AV.Query('Work');
        
        // 包含作者信息
        workQuery.include('user');
        // 按照浏览量排序
        workQuery.descending('viewCount');
        // 按照点赞数排序
        workQuery.descending('likeCount');
        // 只获取公开的作品
        workQuery.equalTo('isPublic', true);
        // 确保作品状态是已完成的
        workQuery.equalTo('status', 'completed');
        
        // 设置返回数量
        workQuery.limit(limit);
        
        // 执行查询
        const works = await workQuery.find();
        
        // 格式化结果
        return works.map(work => ({
            id: work.id,
            title: work.get('title'),
            description: work.get('description'),
            imageUrl: work.get('imageUrl'),
            audioUrl: work.get('audioUrl'),
            style: work.get('style'),
            viewCount: work.get('viewCount') || 0,
            likeCount: work.get('likeCount') || 0,
            author: {
                id: work.get('user')?.id,
                username: work.get('user')?.get('username'),
                avatar: work.get('user')?.get('avatar')
            },
            createdAt: work.createdAt
        }));
    } catch (error) {
        console.error('Failed to fetch popular works:', error);
        return [];
    }
}; 